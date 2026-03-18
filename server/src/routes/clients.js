import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { ClientController } from '../shared/controllers/client.controller.js';
import * as schemas from '../shared/schemas/client.schema.js';

const router = express.Router();

// --- Core Client Reads ---
router.get('/', authenticate, validate(schemas.getClientsSchema), asyncHandler(ClientController.getAll));
router.get('/:id', authenticate, validate(schemas.getByIdSchema), asyncHandler(ClientController.getById));
router.get('/:id/tasks', authenticate, validate(schemas.getByIdSchema), asyncHandler(ClientController.getTasks));
router.get('/:id/activity', authenticate, validate(schemas.getByIdSchema), asyncHandler(ClientController.getActivity));
router.get('/:id/applications', authenticate, validate(schemas.getByIdSchema), asyncHandler(ClientController.getApplications));

// --- Core Client Mutations ---
router.post('/', authenticate, validate(schemas.createClientSchema), asyncHandler(ClientController.create));
router.patch('/:id', authenticate, validate(schemas.updateClientSchema), asyncHandler(ClientController.update));
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), validate(schemas.deleteClientSchema), asyncHandler(ClientController.delete));

// --- Auth & Access Management ---
router.post('/:id/accept-access', authenticate, validate(schemas.getByIdSchema), asyncHandler(ClientController.acceptAccess));
router.post('/:id/invite', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.getByIdSchema), asyncHandler(ClientController.invite));
router.post('/:id/disconnect-agent', authenticate, validate(schemas.getByIdSchema), asyncHandler(ClientController.disconnectAgent));

// --- Sub-Documents: Skill Assessments ---
router.post('/:id/skill-assessments', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addSkillAssessment));
router.patch('/:id/skill-assessments/:idx', authenticate, validate(schemas.updateArrayItemSchema), asyncHandler(ClientController.updateSkillAssessment));

// --- Sub-Documents: Immigration History ---
router.post('/:id/immigration-history', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addImmigrationHistory));
router.patch('/:id/immigration-history/:idx', authenticate, validate(schemas.updateArrayItemSchema), asyncHandler(ClientController.updateImmigrationHistory));

// --- Sub-Documents: Activities & Notes ---
router.post('/:id/activities', authenticate, validate(schemas.addActivitySchema), asyncHandler(ClientController.addActivity));
router.patch('/:id/activities/:aid', authenticate, validate(schemas.updateActivitySchema), asyncHandler(ClientController.updateActivity));
router.delete('/:id/activities/:aid', authenticate, validate(schemas.deleteActivitySchema), asyncHandler(ClientController.deleteActivity));

router.post('/:id/notes', authenticate, validate(schemas.addNoteSchema), asyncHandler(ClientController.addNote));
router.patch('/:id/notes/:idx', authenticate, validate(schemas.updateNoteSchema), asyncHandler(ClientController.updateNote));
router.delete('/:id/notes/:idx', authenticate, validate(schemas.deleteNoteSchema), asyncHandler(ClientController.deleteNote));

// --- STUDENT DATA CRUD (Profile/Immigration/Education/Experience) ---
router.patch('/:id/profile', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateProfile));
router.patch('/:id/profile/statement', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateProfileStatement));

router.patch('/:id/immigration', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateImmigration));
router.patch('/:id/english-test', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateEnglishTest));

router.patch('/:id/addresses/current', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateCurrentAddress));
router.post('/:id/addresses', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addPreviousAddress));
router.delete('/:id/addresses/:addrId', authenticate, validate(schemas.deleteNestedSchema('addrId')), asyncHandler(ClientController.deletePreviousAddress));

router.post('/:id/education', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addEducation));
router.delete('/:id/education/:eduId', authenticate, validate(schemas.deleteNestedSchema('eduId')), asyncHandler(ClientController.deleteEducation));

router.post('/:id/experience', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addExperience));
router.delete('/:id/experience/:expId', authenticate, validate(schemas.deleteNestedSchema('expId')), asyncHandler(ClientController.deleteExperience));

router.post('/:id/travel-history', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addTravelHistory));
router.delete('/:id/travel-history/:travId', authenticate, validate(schemas.deleteNestedSchema('travId')), asyncHandler(ClientController.deleteTravelHistory));

router.post('/:id/family-members', authenticate, validate(schemas.addArrayItemSchema), asyncHandler(ClientController.addFamilyMember));
router.delete('/:id/family-members/:memId', authenticate, validate(schemas.deleteNestedSchema('memId')), asyncHandler(ClientController.deleteFamilyMember));

router.patch('/:id/skills', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateSkills));
router.patch('/:id/health', authenticate, validate(schemas.updateGenericSchema), asyncHandler(ClientController.updateHealth));

export default router;
