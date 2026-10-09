import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  garage: {
    name: string;
    tagline?: string;
    email?: string;
    phone?: string;
    altPhone?: string;
    address?: string;
    gstin?: string;
    logoUrl?: string;
  };
  finance: {
    currency: string;
    taxRate: number;
    invoicePrefix: string;
    paymentTermsDays: number;
  };
  operations: {
    openTime: string;
    closeTime: string;
    weekendOpenTime?: string;
    weekendCloseTime?: string;
    slotMinutes: number;
    maxDailyAppointments: number;
    bayCount: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    reminderHoursBefore: number;
  };
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    garage: {
      name: { type: String, default: 'CyberAutoSuite Service Center' },
      tagline: { type: String, default: 'Your car deserves a co-pilot, not a mechanic.' },
      email: { type: String, default: 'info@cyberautosuite.com' },
      phone: { type: String, default: '+91 98765 43210' },
      altPhone: { type: String, default: '' },
      address: { type: String, default: 'Plot 14, Industrial Area Phase 2, Chandigarh 160002' },
      gstin: { type: String, default: '04ABCDE1234F1Z5' },
      logoUrl: { type: String, default: '' },
    },
    finance: {
      currency: { type: String, default: 'INR' },
      taxRate: { type: Number, default: 18 },
      invoicePrefix: { type: String, default: 'INV' },
      paymentTermsDays: { type: Number, default: 7 },
    },
    operations: {
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '19:00' },
      weekendOpenTime: { type: String, default: '09:00' },
      weekendCloseTime: { type: String, default: '14:00' },
      slotMinutes: { type: Number, default: 30 },
      maxDailyAppointments: { type: Number, default: 24 },
      bayCount: { type: Number, default: 6 },
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      reminderHoursBefore: { type: Number, default: 24 },
    },
  },
  { timestamps: true },
);

export const Setting: Model<ISetting> =
  (mongoose.models.Setting as Model<ISetting>) ||
  mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
