import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IPart extends Document {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  unit: string;
  costPrice: number;
  unitPrice: number;
  stockQty: number;
  reorderLevel: number;
  rackLocation?: string;
  supplier?: string;
  compatibleWith: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PartSchema = new Schema<IPart>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: [true, 'Part name is required'], trim: true, maxlength: 140 },
    category: { type: String, default: 'General', trim: true, index: true },
    brand: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    unit: { type: String, default: 'pc', trim: true },
    costPrice: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 5, min: 0 },
    rackLocation: { type: String, trim: true },
    supplier: { type: String, trim: true },
    compatibleWith: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

PartSchema.virtual('isLowStock').get(function isLowStock(this: IPart) {
  return this.stockQty <= this.reorderLevel;
});

PartSchema.index({ name: 'text', sku: 'text', brand: 'text' });

export const Part: Model<IPart> =
  (mongoose.models.Part as Model<IPart>) || mongoose.model<IPart>('Part', PartSchema);

export default Part;
