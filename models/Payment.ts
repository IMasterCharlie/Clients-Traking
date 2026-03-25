import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  type: 'one_time' | 'subscription' | 'milestone';
  amount: number;
  currency: string;
  exchangeRate?: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial' | 'refunded';
  dueDate: Date;
  paidDate?: Date;
  description: string;
  invoiceId?: mongoose.Types.ObjectId;
  isRecurring: boolean;
  recurringDay?: number; // 1-28
  nextDueDate?: Date;
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: ['one_time', 'subscription', 'milestone'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    exchangeRate: { type: Number },
    status: { type: String, enum: ['paid', 'unpaid', 'overdue', 'partial', 'refunded'], default: 'unpaid', index: true },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    description: { type: String, required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    isRecurring: { type: Boolean, default: false },
    recurringDay: { type: Number, min: 1, max: 28 },
    nextDueDate: { type: Date },
    reminderSent: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
