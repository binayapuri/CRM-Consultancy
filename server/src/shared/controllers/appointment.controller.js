import { AppointmentService } from '../services/appointment.service.js';

export class AppointmentController {
  static async getUserAppointments(req, res) {
    const appointments = await AppointmentService.getUserAppointments(req.user);
    res.json(appointments);
  }

  static async bookAppointment(req, res) {
    const appointment = await AppointmentService.bookAppointment(req.user.id, req.body);
    res.status(201).json(appointment);
  }
}
