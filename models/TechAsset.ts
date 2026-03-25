import mongoose, { Schema, Document } from 'mongoose';

export interface ITechAsset extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hosting?: {
    provider?: string;
    loginUrl?: string;
    username?: string;
    plan?: string;
    expiryDate?: Date;
    cost?: number;
    currency?: string;
    reminderDays?: number;
    notes?: string;
  };
  domain?: {
    registrar?: string;
    domainName?: string;
    expiryDate?: Date;
    autoRenewal?: boolean;
    cost?: number;
    reminderDays?: number;
    notes?: string;
  };
  ssl?: {
    provider?: string;
    issuedDate?: Date;
    expiryDate?: Date;
    reminderDays?: number;
    notes?: string;
  };
  database?: {
    type?: 'mysql' | 'pgsql' | 'mongodb' | 'sqlite' | 'other';
    host?: string;
    port?: string;
    dbName?: string;
    backupSchedule?: string;
    lastBackup?: Date;
    notes?: string;
  };
  github?: {
    repoUrl?: string;
    deployBranch?: string;
    accessStatus?: 'owner' | 'collaborator' | 'none';
    lastPushedAt?: Date;
    isPrivate?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TechAssetSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hosting: {
      provider: String,
      loginUrl: String,
      username: String,
      plan: String,
      expiryDate: Date,
      cost: Number,
      currency: { type: String, default: 'USD' },
      reminderDays: { type: Number, default: 30 },
      notes: String,
    },
    domain: {
      registrar: String,
      domainName: String,
      expiryDate: Date,
      autoRenewal: Boolean,
      cost: Number,
      reminderDays: { type: Number, default: 30 },
      notes: String,
    },
    ssl: {
      provider: String,
      issuedDate: Date,
      expiryDate: Date,
      reminderDays: { type: Number, default: 14 },
      notes: String,
    },
    database: {
      type: { type: String, enum: ['mysql', 'pgsql', 'mongodb', 'sqlite', 'other'] },
      host: String,
      port: String,
      dbName: String,
      backupSchedule: String,
      lastBackup: Date,
      notes: String,
    },
    github: {
      repoUrl: String,
      deployBranch: String,
      accessStatus: { type: String, enum: ['owner', 'collaborator', 'none'] },
      lastPushedAt: Date,
      isPrivate: Boolean,
    },
  },
  { timestamps: true }
);

export default mongoose.models.TechAsset ||
  mongoose.model<ITechAsset>('TechAsset', TechAssetSchema);
