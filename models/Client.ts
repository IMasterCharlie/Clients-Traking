import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string; // ISO 3166-1 alpha-2
  currency: string; // ISO 4217
  taxId?: string;
  status: 'active' | 'inactive' | 'archived';
  portalToken: string;
  portalEnabled: boolean;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    country: { type: String },
    currency: { type: String, default: 'USD' },
    taxId: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
    portalToken: { type: String, unique: true, default: () => uuidv4() },
    portalEnabled: { type: Boolean, default: false },
    notes: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
