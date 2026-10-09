import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { SERVICE_CATEGORIES } from '@/lib/constants';

export interface IService extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  category: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  estimatedHours: number;
  includes: string[];
  icon?: string;
  image?: string;
  isFeatured: boolean;
  isActive: boolean;
  bookingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: [true, 'Service name is required'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: SERVICE_CATEGORIES, default: 'Maintenance', index: true },
    shortDescription: { type: String, trim: true, maxlength: 240 },
    description: { type: String, trim: true, maxlength: 4000 },
    basePrice: { type: Number, required: true, min: 0 },
    estimatedHours: { type: Number, default: 1, min: 0.25 },
    includes: { type: [String], default: [] },
    icon: { type: String, default: 'wrench' },
    image: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    bookingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const Service: Model<IService> =
  (mongoose.models.Service as Model<IService>) ||
  mongoose.model<IService>('Service', ServiceSchema);

export default Service;
