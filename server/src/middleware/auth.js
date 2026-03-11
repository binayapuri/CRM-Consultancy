import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Consultancy from '../models/Consultancy.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired. Please sign in again.' : 'Invalid token. Please sign in again.';
    res.status(401).json({ error: message });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

/** Map feature names to permission paths in rolePermissions */
const FEATURE_MAP = {
  clients: { path: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
  applications: { path: 'applications', actions: ['view', 'create', 'edit', 'delete'] },
  tasks: { path: 'tasks', actions: ['view', 'create', 'edit', 'delete'] },
  kanban: { path: 'kanban', actions: ['view', 'edit'] },
  leads: { path: 'leads', actions: ['view', 'create', 'edit', 'delete'] },
  documents: { path: 'documents', actions: ['view', 'upload', 'delete'] },
  trustLedger: { path: 'trustLedger', actions: ['view', 'edit'] },
  employees: { path: 'employees', actions: ['view', 'manage'] },
  traceHistory: { path: 'traceHistory', actions: ['view'] },
  settings: { path: 'settings', actions: ['view', 'edit'] },
  colleges: { path: 'colleges', actions: ['view', 'manage'] },
  oshc: { path: 'oshc', actions: ['view', 'manage'] },
  sendDocuments: { path: 'sendDocuments', actions: [true] },
  sendAdvice: { path: 'sendAdvice', actions: [true] },
  sponsors: { path: 'sponsors', actions: ['view', 'create', 'edit', 'delete'] },
};

/** Check if user has permission for feature:action. SUPER_ADMIN always allowed. */
export const requirePermission = (feature, action = 'view') => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role === 'SUPER_ADMIN') return next();

  const cid = req.user.profile?.consultancyId;
  if (!cid) return res.status(403).json({ error: 'No consultancy assigned' });

  const consultancy = await Consultancy.findById(cid).select('rolePermissions').lean();
  if (!consultancy) return res.status(404).json({ error: 'Consultancy not found' });

  const rolePerms = consultancy.rolePermissions || [];
  const userRole = ['CONSULTANCY_ADMIN', 'MANAGER'].includes(req.user.role) ? 'CONSULTANCY_ADMIN' : req.user.role === 'AGENT' ? 'AGENT' : 'SUPPORT';
  const rp = rolePerms.find((r) => r.role === userRole);

  if (!rp || !rp.permissions) {
    if (feature === 'trustLedger') return res.status(403).json({ error: 'Insufficient permissions' });
    return next();
  }

  const fm = FEATURE_MAP[feature];
  if (!fm) return next();

  if (fm.actions[0] === true) {
    const val = rp.permissions[fm.path];
    if (val === false) return res.status(403).json({ error: 'Insufficient permissions' });
    return next();
  }

  const perm = rp.permissions[fm.path];
  if (!perm || perm[action] === false) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

/** Get effective permissions for current user (for frontend). When rolePermissions empty, allow all for admin/agent. */
export async function getUserPermissions(user) {
  if (!user || user.role === 'SUPER_ADMIN') return null;
  const cid = user.profile?.consultancyId;
  if (!cid) return {};
  const consultancy = await Consultancy.findById(cid).select('rolePermissions').lean();
  if (!consultancy) return {};
  const rolePerms = consultancy.rolePermissions || [];
  const userRole = ['CONSULTANCY_ADMIN', 'MANAGER'].includes(user.role) ? 'CONSULTANCY_ADMIN' : user.role === 'AGENT' ? 'AGENT' : 'SUPPORT';
  const rp = rolePerms.find((r) => r.role === userRole);
  if (!rp || !rp.permissions) {
    if (['CONSULTANCY_ADMIN', 'MANAGER'].includes(userRole) || userRole === 'AGENT') return null;
    return {};
  }
  return rp.permissions;
}
