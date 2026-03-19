import Consultancy from '../models/Consultancy.js';
import User from '../models/User.js';
import { ClientService, CAMPAIGN_TEMPLATES } from './client.service.js';

const POLL_INTERVAL_MS = Math.max(Number(process.env.CAMPAIGN_SCHEDULER_INTERVAL_MS || 10 * 60 * 1000), 60 * 1000);
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let schedulerTimer = null;
let schedulerRunning = false;

function getDateParts(value, timeZone = 'Australia/Sydney') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(value).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekdayShort: parts.weekday,
  };
}

function getWeekdayIndex(parts) {
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[parts.weekdayShort] ?? 0;
}

function getDayKey(value, timeZone) {
  const parts = getDateParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function getWeekKey(value, timeZone) {
  const parts = getDateParts(value, timeZone);
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const weekday = utcDate.getUTCDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday);
  return utcDate.toISOString().slice(0, 10);
}

function defaultSchedules() {
  return {
    VISA_EXPIRY_30: { enabled: false, frequency: 'DAILY', weekday: 1, hour: 9, minute: 0 },
    DOCUMENT_EXPIRY_30: { enabled: false, frequency: 'DAILY', weekday: 1, hour: 9, minute: 15 },
    RFI_RESPONSE_7: { enabled: false, frequency: 'DAILY', weekday: 1, hour: 9, minute: 30 },
    PRIVACY_CONSENT_GAP: { enabled: false, frequency: 'WEEKLY', weekday: 1, hour: 10, minute: 0 },
  };
}

export function normalizeCampaignAutomation(input = {}) {
  const defaults = defaultSchedules();
  const incoming = input?.schedules || {};
  const schedules = Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const base = defaults[key];
      const next = incoming?.[key] || {};
      return [key, {
        ...base,
        ...next,
        enabled: !!next.enabled,
        frequency: next.frequency === 'WEEKLY' ? 'WEEKLY' : 'DAILY',
        weekday: Number.isInteger(next.weekday) ? Math.max(0, Math.min(6, Number(next.weekday))) : base.weekday,
        hour: Number.isFinite(Number(next.hour)) ? Math.max(0, Math.min(23, Number(next.hour))) : base.hour ?? DEFAULT_HOUR,
        minute: Number.isFinite(Number(next.minute)) ? Math.max(0, Math.min(59, Number(next.minute))) : base.minute ?? DEFAULT_MINUTE,
      }];
    })
  );
  return {
    schedules,
    lastSchedulerHeartbeatAt: input?.lastSchedulerHeartbeatAt,
  };
}

function isScheduleDue(schedule, now, timeZone) {
  if (!schedule?.enabled) return { due: false, runKey: null };
  const parts = getDateParts(now, timeZone);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const scheduledMinutes = (Number(schedule.hour ?? DEFAULT_HOUR) * 60) + Number(schedule.minute ?? DEFAULT_MINUTE);
  if (currentMinutes < scheduledMinutes) return { due: false, runKey: null };

  if (schedule.frequency === 'WEEKLY') {
    if (getWeekdayIndex(parts) !== Number(schedule.weekday ?? 1)) return { due: false, runKey: null };
    return { due: true, runKey: getWeekKey(now, timeZone) };
  }

  return { due: true, runKey: getDayKey(now, timeZone) };
}

async function getAutomationActor(consultancyId) {
  const users = await User.find({
    'profile.consultancyId': consultancyId,
    isActive: true,
    role: { $in: ['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'] },
  }).sort({ createdAt: 1 });
  const priorities = ['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'];
  return priorities.map((role) => users.find((user) => user.role === role)).find(Boolean) || null;
}

export class CampaignSchedulerService {
  static async runCycle() {
    if (schedulerRunning) return;
    schedulerRunning = true;
    try {
      const now = new Date();
      const consultancies = await Consultancy.find({
        $or: Object.keys(CAMPAIGN_TEMPLATES).map((key) => ({ [`campaignAutomation.schedules.${key}.enabled`]: true })),
      }).select('_id settings campaignAutomation');

      for (const consultancy of consultancies) {
        const timeZone = consultancy.settings?.timezone || 'Australia/Sydney';
        const automation = normalizeCampaignAutomation(consultancy.campaignAutomation || {});

        await Consultancy.updateOne({ _id: consultancy._id }, {
          $set: { campaignAutomation: { ...automation, lastSchedulerHeartbeatAt: now } },
        });

        for (const campaignKey of Object.keys(CAMPAIGN_TEMPLATES)) {
          const schedule = automation.schedules?.[campaignKey];
          const { due, runKey } = isScheduleDue(schedule, now, timeZone);
          if (!due || !runKey) continue;

          const claimed = await Consultancy.findOneAndUpdate(
            {
              _id: consultancy._id,
              [`campaignAutomation.schedules.${campaignKey}.enabled`]: true,
              [`campaignAutomation.schedules.${campaignKey}.lastRunKey`]: { $ne: runKey },
            },
            {
              $set: {
                [`campaignAutomation.schedules.${campaignKey}.lastRunKey`]: runKey,
                [`campaignAutomation.schedules.${campaignKey}.lastAttemptAt`]: now,
                [`campaignAutomation.schedules.${campaignKey}.lastError`]: '',
              },
            },
            { new: true }
          );
          if (!claimed) continue;

          const actor = await getAutomationActor(consultancy._id);
          if (!actor) {
            await Consultancy.updateOne({ _id: consultancy._id }, {
              $set: {
                [`campaignAutomation.schedules.${campaignKey}.lastError`]: 'No active consultancy admin/manager/agent available for scheduled sends.',
              },
            });
            continue;
          }

          try {
            const audienceData = await ClientService.getCampaignAudience(
              { consultancyId: String(consultancy._id), campaignKey },
              { role: 'SUPER_ADMIN' }
            );
            const audienceCount = audienceData?.clientIds?.length || 0;

            if (!audienceCount) {
              await Consultancy.updateOne({ _id: consultancy._id }, {
                $set: {
                  [`campaignAutomation.schedules.${campaignKey}.lastRunAt`]: now,
                  [`campaignAutomation.schedules.${campaignKey}.lastAudienceCount`]: 0,
                  [`campaignAutomation.schedules.${campaignKey}.lastSentCount`]: 0,
                  [`campaignAutomation.schedules.${campaignKey}.lastFailedCount`]: 0,
                  [`campaignAutomation.schedules.${campaignKey}.lastCampaignLogId`]: null,
                  [`campaignAutomation.schedules.${campaignKey}.lastError`]: '',
                },
              });
              continue;
            }

            const result = await ClientService.sendBulkEmail({
              consultancyId: String(consultancy._id),
              clientIds: audienceData.clientIds,
              subject: audienceData.subject,
              body: audienceData.body,
              mergeData: audienceData.mergeData,
              campaignKey,
              campaignLabel: `${audienceData.label} (Scheduled)`,
              audience: audienceData.audience,
              triggerSource: 'SCHEDULED',
              scheduledRun: true,
              scheduleKey: campaignKey,
            }, actor);

            await Consultancy.updateOne({ _id: consultancy._id }, {
              $set: {
                [`campaignAutomation.schedules.${campaignKey}.lastRunAt`]: now,
                [`campaignAutomation.schedules.${campaignKey}.lastAudienceCount`]: audienceCount,
                [`campaignAutomation.schedules.${campaignKey}.lastSentCount`]: Number(result?.sentCount || result?.sent || 0),
                [`campaignAutomation.schedules.${campaignKey}.lastFailedCount`]: Number(result?.failed || 0),
                [`campaignAutomation.schedules.${campaignKey}.lastCampaignLogId`]: result?.campaignLogId || null,
                [`campaignAutomation.schedules.${campaignKey}.lastError`]: '',
              },
            });
          } catch (error) {
            await Consultancy.updateOne({ _id: consultancy._id }, {
              $set: {
                [`campaignAutomation.schedules.${campaignKey}.lastError`]: error?.message || 'Scheduled campaign failed.',
              },
            });
          }
        }
      }
    } finally {
      schedulerRunning = false;
    }
  }

  static start() {
    if (schedulerTimer) return;
    schedulerTimer = setInterval(() => {
      this.runCycle().catch((error) => {
        console.error('[CampaignScheduler] cycle failed', error);
      });
    }, POLL_INTERVAL_MS);

    this.runCycle().catch((error) => {
      console.error('[CampaignScheduler] initial run failed', error);
    });
  }

  static stop() {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  static describeSchedule(schedule = {}) {
    if (!schedule?.enabled) return 'Off';
    const hh = String(schedule.hour ?? DEFAULT_HOUR).padStart(2, '0');
    const mm = String(schedule.minute ?? DEFAULT_MINUTE).padStart(2, '0');
    if (schedule.frequency === 'WEEKLY') {
      return `Weekly on ${WEEKDAY_LABELS[Number(schedule.weekday ?? 1)]} at ${hh}:${mm}`;
    }
    return `Daily at ${hh}:${mm}`;
  }
}
