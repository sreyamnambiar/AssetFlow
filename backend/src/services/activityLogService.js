import { ActivityLog } from '../models/ActivityLog.js';
import mongoose from 'mongoose';

export async function createLog(userId, action, module, description) {
  return ActivityLog.create({ user_id: userId, action, module, description });
}

export async function getLogs(query = {}) {
  const filter = {};
  
  if (query.user) filter.user_id = query.user;
  if (query.module) filter.module = { $regex: query.module, $options: 'i' };
  
  // Basic date filter (from string YYYY-MM-DD)
  if (query.date) {
    const start = new Date(query.date);
    const end = new Date(query.date);
    end.setDate(end.getDate() + 1);
    filter.created_at = { $gte: start, $lt: end };
  }

  // General search term acting on action or description
  if (query.search) {
    filter.$or = [
      { action: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  const limit = Math.min(parseInt(query.limit) || 50, 200);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user_id', 'name email role')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}
