import Notification from '../models/Notification.js';

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
  const docs = toNotify.map(userId => ({
    consultancyId,
    userId,
    type,
    title,
    message: message || '',
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  }));
  return Notification.insertMany(docs);
}
