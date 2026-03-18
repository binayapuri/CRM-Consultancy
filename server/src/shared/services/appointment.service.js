import Appointment from '../../shared/models/Appointment.js';

export class AppointmentService {
  static async getUserAppointments(user) {
    const query = user.role === 'STUDENT' ? { studentId: user.id } : { agentId: user.id };
    return Appointment.find(query)
      .populate('studentId', 'profile.firstName profile.lastName')
      .populate('agentId', 'profile.firstName profile.lastName avatar')
      .populate('consultancyId', 'name displayName logo');
  }

  static async bookAppointment(studentId, data) {
    const { agentId, consultancyId, startTime, topic, notes } = data;
    const end = new Date(startTime);
    end.setMinutes(end.getMinutes() + 30);

    const appointment = new Appointment({
      studentId,
      agentId,
      consultancyId,
      startTime,
      endTime: end,
      topic,
      notes,
      meetingLink: 'https://meet.google.com/new'
    });
    
    return appointment.save();
  }
}
