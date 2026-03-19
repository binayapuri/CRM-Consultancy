import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { publishUserNotification } from './notification-broker.js';

function getCategoryForType(type) {
  const value = String(type || '').toUpperCase();
  if (value.includes('TASK')) return 'tasks';
  if (value.includes('DEADLINE') || value.includes('EXPIRY') || value.includes('RFI') || value.includes('S56')) return 'deadlines';
  if (value.includes('DOCUMENT') || value.includes('CHECKLIST')) return 'documents';
  if (value.includes('INVOICE') || value.includes('BILLING') || value.includes('QUOTE')) return 'billing';
  if (value.includes('MESSAGE')) return 'messages';
  if (value.includes('COMMUNITY')) return 'community';
  if (value.includes('JOB')) return 'jobs';
  if (value.includes('ACCESS') || value.includes('INVITATION')) return 'access';
  if (value.includes('MARKETING')) return 'marketing';
  return 'system';
}

function canReceiveInApp(user, type) {
  const prefs = user?.profile?.notificationPreferences || {};
  const categories = prefs.categories || {};
  const category = getCategoryForType(type);
  const inApp = prefs.inApp !== false;
  const categoryEnabled = categories[category] !== false;
  return inApp && categoryEnabled;
}

export async function createNotification({ consultancyId, userId, type, title, message, relatedEntityType, relatedEntityId }) {
  if (!userId) return null;
  const user = await User.findById(userId).select('profile.notificationPreferences').lean();
  if (!user || !canReceiveInApp(user, type)) return null;
  const doc = await Notification.create({
    consultancyId: consultancyId || null,
    userId,
    type,
    title,
    message: message || '',
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  });
  publishUserNotification(userId, 'notification', doc.toObject ? doc.toObject() : doc);
  return doc;
}

/**
 * Create notifications for multiple users. Each user receives their own notification.
 * Excludes null/undefined and optionally excludes the actor (e.g. don't notify yourself).
 * @param {Object} options
 * @param {ObjectId} options.consultancyId
 * @param {ObjectId[]} options.userIds - Array of user IDs to notify
 * @param {ObjectId} [options.excludeUserId] - User to exclude (e.g. the person who triggered the action)
 * @param {string} options.type - Notification type
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {string} [options.relatedEntityType]
 * @param {ObjectId} [options.relatedEntityId]
 */
export async function notifyUsers({ consultancyId, userIds, excludeUserId, type, title, message, relatedEntityType, relatedEntityId }) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const unique = [...new Set(ids.map(id => id?.toString()).filter(Boolean))];
  const toNotify = excludeUserId
    ? unique.filter(id => id !== excludeUserId.toString())
    : unique;
  if (toNotify.length === 0) return [];
  const users = await User.find({ _id: { $in: toNotify } }).select('profile.notificationPreferences').lean();
  const allowedIds = users.filter((user) => canReceiveInApp(user, type)).map((user) => String(user._id));
  if (!allowedIds.length) return [];
  const docs = allowedIds.map(userId => ({
    consultancyId,
    userId,
    type,
    title,
    message: message || '',
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  }));
  const inserted = await Notification.insertMany(docs);
  inserted.forEach((doc) => publishUserNotification(doc.userId, 'notification', doc));
  return inserted;
}
