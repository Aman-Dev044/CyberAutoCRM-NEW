import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { APPOINTMENT_STATUS, type AppointmentStatus } from '@/lib/constants';

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  code: string;
  customer: Types.ObjectId;
  vehicle: Types.ObjectId;
  services: Types.ObjectId[];
  scheduledAt: Date;
  slot: string;
  status: AppointmentStatus;
  source: 'ONLINE' | 'PHONE' | 'WALK_IN' | 'ADMIN';
  assignedTechnician?: Types.ObjectId | null;
  estimatedCost: number;
  concern?: string;
  notes?: string;
  pickupRequired: boolean;
  pickupAddress?: string;
  statusHistory: { status: AppointmentStatus; at: Date; by?: Types.ObjectId | null; note?: string }[];
  serviceOrder?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    scheduledAt: { type: Date, required: true, index: true },
    slot: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUS, default: 'PENDING', index: true },
    source: { type: String, enum: ['ONLINE', 'PHONE', 'WALK_IN', 'ADMIN'], default: 'ONLINE' },
    assignedTechnician: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    estimatedCost: { type: Number, default: 0, min: 0 },
    concern: { type: String, trim: true, maxlength: 2000 },
    notes: { type: String, trim: true, maxlength: 2000 },
    pickupRequired: { type: Boolean, default: false },
    pickupAddress: { type: String, trim: true },
    statusHistory: [
      {
        status: { type: String, enum: APPOINTMENT_STATUS },
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        note: { type: String, trim: true },
        _id: false,
      },
    ],
    serviceOrder: { type: Schema.Types.ObjectId, ref: 'ServiceOrder', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

AppointmentSchema.index({ scheduledAt: 1, status: 1 });

export const Appointment: Model<IAppointment> =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
