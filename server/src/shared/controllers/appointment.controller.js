import { AppointmentService } from '../services/appointment.service.js';

export class AppointmentController {
  static async getUserAppointments(req, res) {
    const appointments = await AppointmentService.getUserAppointments(req.user, req.query);
    res.json(appointments);
  }

  static async bookAppointment(req, res) {
    const appointment = await AppointmentService.bookAppointment(req.user, req.body);
    res.status(201).json(appointment);
  }

  static async updateAppointment(req, res) {
    const appointment = await AppointmentService.updateAppointment(req.params.id, req.user, req.body || {});
    res.json(appointment);
  }
}
