import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export const USER_ROLES = ['admin', 'asset_manager', 'department_head', 'employee'];
export const USER_STATUS = ['active', 'inactive'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'employee', trim: true },
    status: { type: String, enum: USER_STATUS, default: 'active', trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    phone: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);