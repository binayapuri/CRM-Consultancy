import Appointment from '../../shared/models/Appointment.js';
import { logAudit } from '../../shared/utils/audit.js';

export class AppointmentService {
  static async getUserAppointments(user, opts = {}) {
    let query = user.role === 'STUDENT' ? { studentId: user.id } : { agentId: user.id };
    if (user.role !== 'STUDENT' && opts.scope === 'consultancy') {
      const consultancyId = user.role === 'SUPER_ADMIN' ? opts.consultancyId : (user.profile?.consultancyId || user._id);
      if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });
      query = { consultancyId };
    }
    return Appointment.find(query)
      .populate('studentId', 'profile.firstName profile.lastName')
      .populate('agentId', 'profile.firstName profile.lastName avatar')
      .populate('consultancyId', 'name displayName logo')
      .sort({ startTime: 1 });
  }

  static async bookAppointment(actor, data) {
    const isStudent = actor.role === 'STUDENT';
    const consultancyId = isStudent
      ? data.consultancyId
      : (actor.role === 'SUPER_ADMIN' && data.consultancyId ? data.consultancyId : (actor.profile?.consultancyId || actor._id));
    if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });

    const studentId = isStudent ? actor.id : data.studentId;
    if (!studentId) throw Object.assign(new Error('Student is required'), { status: 400 });

    const { agentId, startTime, topic, notes, meetingLink, internalNotes, status } = data;
    const end = data.endTime ? new Date(data.endTime) : new Date(startTime);
    if (!data.endTime) end.setMinutes(end.getMinutes() + 30);

    const appointment = new Appointment({
      studentId,
      agentId,
      consultancyId,
      startTime,
      endTime: end,
      topic,
      notes,
      meetingLink: meetingLink || 'https://meet.google.com/new',
      internalNotes,
      status: status || (isStudent ? 'PENDING' : 'CONFIRMED'),
    });

    const saved = await appointment.save();
    await logAudit(consultancyId, 'Appointment', saved._id, 'CREATE', actor._id, {
      description: `Appointment booked: ${topic || 'Consultation'}`,
      metadata: { startTime, status: saved.status },
      assignedAgentId: agentId,
    });
    return saved;
  }

  static async updateAppointment(id, user, data) {
    const appointment = await Appointment.findById(id);
    if (!appointment) throw Object.assign(new Error('Not found'), { status: 404 });

    if (user.role === 'STUDENT') {
      if (appointment.studentId?.toString() !== user._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
      const allowed = {};
      if (data.notes !== undefined) allowed.notes = data.notes;
      if (data.status !== undefined) allowed.status = data.status;
      Object.assign(appointment, allowed);
    } else {
      const cid = user.role === 'SUPER_ADMIN' ? appointment.consultancyId?.toString() : String(user.profile?.consultancyId || user._id);
      if (user.role !== 'SUPER_ADMIN' && appointment.consultancyId?.toString() !== cid) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
      const oldStart = appointment.startTime ? new Date(appointment.startTime) : null;
      const oldEnd = appointment.endTime ? new Date(appointment.endTime) : null;
      Object.assign(appointment, data);
      if (data.startTime && !data.endTime && appointment.endTime) {
        const newStart = new Date(data.startTime);
        const durationMs = oldStart && oldEnd ? oldEnd.getTime() - oldStart.getTime() : 30 * 60 * 1000;
        appointment.endTime = new Date(newStart.getTime() + Math.max(durationMs, 30 * 60 * 1000));
      }
    }

    const saved = await appointment.save();
    await logAudit(saved.consultancyId, 'Appointment', saved._id, 'UPDATE', user._id, {
      description: `Appointment updated: ${saved.topic || 'Consultation'}`,
      metadata: { status: saved.status, startTime: saved.startTime, endTime: saved.endTime },
      assignedAgentId: saved.agentId,
    });
    return saved;
  }
}
