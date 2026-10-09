import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { ORDER_PRIORITY, ORDER_STATUS, type OrderPriority, type OrderStatus } from '@/lib/constants';

export interface IOrderLine {
  service?: Types.ObjectId | null;
  name: string;
  price: number;
  hours: number;
  qty: number;
}

export interface IOrderPart {
  part?: Types.ObjectId | null;
  name: string;
  sku?: string;
  qty: number;
  unitPrice: number;
}

export interface IServiceOrder extends Document {
  _id: Types.ObjectId;
  code: string;
  customer: Types.ObjectId;
  vehicle: Types.ObjectId;
  appointment?: Types.ObjectId | null;
  status: OrderStatus;
  priority: OrderPriority;
  technicians: Types.ObjectId[];
  items: IOrderLine[];
  parts: IOrderPart[];
  complaint?: string;
  diagnosis?: string;
  recommendation?: string;
  odometerIn: number;
  odometerOut?: number;
  fuelLevel?: string;
  laborTotal: number;
  partsTotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  estimateApproved: boolean;
  startedAt?: Date;
  promisedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  workLog: {
    at: Date;
    by?: Types.ObjectId | null;
    byName?: string;
    status?: OrderStatus;
    note: string;
  }[];
  invoice?: Types.ObjectId | null;
  customerRating?: number;
  customerFeedback?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  recalculate: () => void;
}

const OrderLineSchema = new Schema<IOrderLine>(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', default: null },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    hours: { type: Number, default: 1, min: 0 },
    qty: { type: Number, default: 1, min: 1 },
  },
  { _id: false },
);

const OrderPartSchema = new Schema<IOrderPart>(
  {
    part: { type: Schema.Types.ObjectId, ref: 'Part', default: null },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    qty: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ServiceOrderSchema = new Schema<IServiceOrder>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
    status: { type: String, enum: ORDER_STATUS, default: 'OPEN', index: true },
    priority: { type: String, enum: ORDER_PRIORITY, default: 'NORMAL', index: true },
    technicians: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    items: { type: [OrderLineSchema], default: [] },
    parts: { type: [OrderPartSchema], default: [] },
    complaint: { type: String, trim: true, maxlength: 2000 },
    diagnosis: { type: String, trim: true, maxlength: 4000 },
    recommendation: { type: String, trim: true, maxlength: 2000 },
    odometerIn: { type: Number, default: 0, min: 0 },
    odometerOut: { type: Number, min: 0 },
    fuelLevel: { type: String, trim: true },
    laborTotal: { type: Number, default: 0, min: 0 },
    partsTotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 18, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
    estimateApproved: { type: Boolean, default: false },
    startedAt: { type: Date },
    promisedAt: { type: Date },
    completedAt: { type: Date },
    deliveredAt: { type: Date },
    workLog: [
      {
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        byName: { type: String, trim: true },
        status: { type: String, enum: ORDER_STATUS },
        note: { type: String, trim: true, required: true },
        _id: false,
      },
    ],
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', default: null },
    customerRating: { type: Number, min: 1, max: 5 },
    customerFeedback: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

/** Recomputes labour, parts, tax and grand total from the current line items. */
ServiceOrderSchema.methods.recalculate = function recalculate(this: IServiceOrder) {
  this.laborTotal = this.items.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
  this.partsTotal = this.parts.reduce((sum, p) => sum + p.unitPrice * (p.qty || 1), 0);
  const taxable = Math.max(0, this.laborTotal + this.partsTotal - (this.discount || 0));
  this.taxAmount = Math.round((taxable * (this.taxRate || 0)) / 100);
  this.grandTotal = taxable + this.taxAmount;
};

ServiceOrderSchema.pre('save', function preSave(next) {
  (this as unknown as IServiceOrder).recalculate();
  next();
});

ServiceOrderSchema.index({ status: 1, createdAt: -1 });

export const ServiceOrder: Model<IServiceOrder> =
  (mongoose.models.ServiceOrder as Model<IServiceOrder>) ||
  mongoose.model<IServiceOrder>('ServiceOrder', ServiceOrderSchema);

export default ServiceOrder;
