import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { FUEL_TYPES, TRANSMISSIONS } from '@/lib/constants';

// Not extending mongoose's Document: the `model` field would clash with Document.model().
export interface IVehicle {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  registrationNumber: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  fuelType: string;
  transmission: string;
  vin?: string;
  engineNumber?: string;
  odometer: number;
  insuranceProvider?: string;
  insuranceExpiry?: Date;
  pucExpiry?: Date;
  lastServiceAt?: Date;
  nextServiceDue?: Date;
  serviceCount: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    make: { type: String, required: [true, 'Make is required'], trim: true },
    model: { type: String, required: [true, 'Model is required'], trim: true },
    variant: { type: String, trim: true },
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear() + 1,
    },
    color: { type: String, trim: true },
    fuelType: { type: String, enum: FUEL_TYPES, default: 'Petrol' },
    transmission: { type: String, enum: TRANSMISSIONS, default: 'Manual' },
    vin: { type: String, trim: true, uppercase: true },
    engineNumber: { type: String, trim: true, uppercase: true },
    odometer: { type: Number, default: 0, min: 0 },
    insuranceProvider: { type: String, trim: true },
    insuranceExpiry: { type: Date },
    pucExpiry: { type: Date },
    lastServiceAt: { type: Date },
    nextServiceDue: { type: Date },
    serviceCount: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

VehicleSchema.index({ registrationNumber: 'text', make: 'text', model: 'text' });

export const Vehicle: Model<IVehicle> =
  (mongoose.models.Vehicle as Model<IVehicle>) ||
  mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;
