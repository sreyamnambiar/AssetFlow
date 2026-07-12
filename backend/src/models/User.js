import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, default: 'employee', trim: true },
    department: { type: String, trim: true },
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);