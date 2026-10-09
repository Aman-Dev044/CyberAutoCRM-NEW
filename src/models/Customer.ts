import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  email?: string;
  phone: string;
  altPhone?: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  company?: string;
  gstin?: string;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  tags: string[];
  notes?: string;
  preferredContact: 'PHONE' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  totalSpend: number;
  visitCount: number;
  lastVisitAt?: Date;
  isActive: boolean;
  user?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true, index: true },
    altPhone: { type: String, trim: true },
    customerType: { type: String, enum: ['INDIVIDUAL', 'BUSINESS'], default: 'INDIVIDUAL' },
    company: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    tags: { type: [String], default: [] },
    notes: { type: String, trim: true, maxlength: 2000 },
    preferredContact: {
      type: String,
      enum: ['PHONE', 'EMAIL', 'SMS', 'WHATSAPP'],
      default: 'PHONE',
    },
    totalSpend: { type: Number, default: 0, min: 0 },
    visitCount: { type: Number, default: 0, min: 0 },
    lastVisitAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

CustomerSchema.virtual('vehicles', {
  ref: 'Vehicle',
  localField: '_id',
  foreignField: 'customer',
});

CustomerSchema.index({ name: 'text', email: 'text', phone: 'text', company: 'text' });

export const Customer: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) ||
  mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
