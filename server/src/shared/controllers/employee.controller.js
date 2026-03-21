import { EmployeeService } from '../services/employee.service.js';

export class EmployeeController {
  static async getJobSheet(req, res) {
    const logs = await EmployeeService.getJobSheet(req.params.id, req.user);
    res.json(logs);
  }

  static async getAll(req, res) {
    const employees = await EmployeeService.getAll(req.user, req.query.consultancyId);
    res.json(employees);
  }

  static async getById(req, res) {
    const employee = await EmployeeService.getById(req.params.id);
    res.json(employee);
  }

  static async create(req, res) {
    const result = await EmployeeService.create(req.body, req.user);
    res.status(201).json(result);
  }

  static async update(req, res) {
    const employee = await EmployeeService.update(req.params.id, req.body, req.user);
    res.json(employee);
  }

  static async delete(req, res) {
    const result = await EmployeeService.delete(req.params.id, req.user);
    res.json(result);
  }
}
