import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true, collection: 'departments' }
);

export const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);
