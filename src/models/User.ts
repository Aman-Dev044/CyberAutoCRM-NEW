import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { ROLES, type Role } from '@/lib/constants';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  customer?: Types.ObjectId | null;
  technician?: {
    employeeId?: string;
    specialization?: string;
    skills: string[];
    hourlyRate: number;
    availability: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
    rating: number;
    jobsCompleted: number;
  };
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianSchema = new Schema(
  {
    employeeId: { type: String, trim: true },
    specialization: { type: String, trim: true },
    skills: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 450, min: 0 },
    availability: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'ON_LEAVE'],
      default: 'AVAILABLE',
    },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    jobsCompleted: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    avatarUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    technician: { type: TechnicianSchema, default: undefined },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

UserSchema.index({ name: 'text', email: 'text' });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
