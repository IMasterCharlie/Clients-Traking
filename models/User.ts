import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPrefs {
  emailAlertsEnabled: boolean;
  hostingExpiryDays: number;
  domainExpiryDays: number;
  sslExpiryDays: number;
  paymentOverdueEnabled: boolean;
  paymentOverdueEmailEnabled: boolean;
  subscriptionDueDays: number;
  hostingExpiryEmailEnabled: boolean;
  domainExpiryEmailEnabled: boolean;
  sslExpiryEmailEnabled: boolean;
  subscriptionDueEmailEnabled: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'viewer';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  refreshToken?: string;
  businessName?: string;
  businessAddress?: string;
  businessLogo?: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  timezone: string;
  notificationPrefs?: INotificationPrefs;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPrefsSchema = new Schema(
  {
    emailAlertsEnabled: { type: Boolean, default: true },
    hostingExpiryDays: { type: Number, default: 30 },
    domainExpiryDays: { type: Number, default: 30 },
    sslExpiryDays: { type: Number, default: 14 },
    paymentOverdueEnabled: { type: Boolean, default: true },
    paymentOverdueEmailEnabled: { type: Boolean, default: true },
    subscriptionDueDays: { type: Number, default: 3 },
    hostingExpiryEmailEnabled: { type: Boolean, default: true },
    domainExpiryEmailEnabled: { type: Boolean, default: true },
    sslExpiryEmailEnabled: { type: Boolean, default: true },
    subscriptionDueEmailEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'viewer'], default: 'admin' },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    refreshToken: { type: String },
    businessName: { type: String },
    businessAddress: { type: String },
    businessLogo: { type: String },
    defaultCurrency: { type: String, default: 'USD' },
    defaultTaxRate: { type: Number, default: 0 },
    timezone: { type: String, default: 'UTC' },
    notificationPrefs: { type: NotificationPrefsSchema },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
