import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { INVOICE_STATUS, PAYMENT_METHODS, type InvoiceStatus } from '@/lib/constants';

export interface IInvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
  kind: 'LABOUR' | 'PART' | 'OTHER';
}

export interface IPayment {
  at: Date;
  amount: number;
  method: string;
  reference?: string;
  receivedBy?: Types.ObjectId | null;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  number: string;
  customer: Types.ObjectId;
  vehicle?: Types.ObjectId | null;
  serviceOrder?: Types.ObjectId | null;
  lines: IInvoiceLine[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate?: Date;
  payments: IPayment[];
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  recalculate: () => void;
}

const InvoiceLineSchema = new Schema<IInvoiceLine>(
  {
    description: { type: String, required: true, trim: true },
    qty: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    kind: { type: String, enum: ['LABOUR', 'PART', 'OTHER'], default: 'OTHER' },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    at: { type: Date, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, default: 'CASH' },
    reference: { type: String, trim: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    serviceOrder: { type: Schema.Types.ObjectId, ref: 'ServiceOrder', default: null, index: true },
    lines: { type: [InvoiceLineSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 18, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: INVOICE_STATUS, default: 'DRAFT', index: true },
    issuedAt: { type: Date, default: Date.now, index: true },
    dueDate: { type: Date },
    payments: { type: [PaymentSchema], default: [] },
    notes: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

/** Keeps totals, paid amount, balance and status in sync with the lines/payments. */
InvoiceSchema.methods.recalculate = function recalculate(this: IInvoice) {
  this.subtotal = this.lines.reduce((sum, l) => sum + l.unitPrice * (l.qty || 1), 0);
  const taxable = Math.max(0, this.subtotal - (this.discount || 0));
  this.taxAmount = Math.round((taxable * (this.taxRate || 0)) / 100);
  this.total = taxable + this.taxAmount;
  this.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.balance = this.total - this.amountPaid;

  if (this.status !== 'VOID' && this.status !== 'DRAFT') {
    if (this.balance <= 0 && this.total > 0) this.status = 'PAID';
    else if (this.amountPaid > 0) this.status = 'PARTIAL';
    else if (this.dueDate && this.dueDate.getTime() < Date.now()) this.status = 'OVERDUE';
    else this.status = 'SENT';
  }
};

InvoiceSchema.pre('save', function preSave(next) {
  (this as unknown as IInvoice).recalculate();
  next();
});

export const Invoice: Model<IInvoice> =
  (mongoose.models.Invoice as Model<IInvoice>) ||
  mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
