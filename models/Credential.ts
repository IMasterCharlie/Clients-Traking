import mongoose, { Schema, Document } from 'mongoose';

export interface ICredential extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  label: string;
  type: 'ftp' | 'cpanel' | 'database' | 'api_key' | 'other';
  username?: string;
  passwordEnc?: string;
  iv?: string;
  authTag?: string;
  url?: string;
  notes?: string;
  lastViewed?: Date;
  createdAt: Date;
}

const CredentialSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['ftp', 'cpanel', 'database', 'api_key', 'other'],
      required: true,
    },
    username: String,
    passwordEnc: String,
    iv: String,
    authTag: String,
    url: String,
    notes: String,
    lastViewed: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Credential ||
  mongoose.model<ICredential>('Credential', CredentialSchema);
