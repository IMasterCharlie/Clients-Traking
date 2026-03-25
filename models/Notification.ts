import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'hosting_expiry' | 'domain_expiry' | 'ssl_expiry' | 'payment_overdue' | 'invoice_sent' | 'subscription_due' | 'invoice_overdue';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedType?: 'project' | 'payment' | 'invoice' | 'techasset';
  isRead: boolean;
  emailSent: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['hosting_expiry', 'domain_expiry', 'ssl_expiry', 'payment_overdue', 'invoice_sent', 'subscription_due', 'invoice_overdue'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId },
    relatedType: { type: String, enum: ['project', 'payment', 'invoice', 'techasset'] },
    isRead: { type: Boolean, default: false, index: true },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
