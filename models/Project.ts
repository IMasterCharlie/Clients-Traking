import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'active' | 'maintenance' | 'completed' | 'pending_payment' | 'paused';
  type: 'one_time' | 'retainer' | 'monthly_maintenance';
  startDate?: Date;
  deadline?: Date;
  liveUrl?: string;
  stagingUrl?: string;
  techStack: string[];
  onboardingDone: string[];
  notes?: string;
  color?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'completed', 'pending_payment', 'paused'],
    default: 'active',
    index: true,
  },
  type: {
    type: String,
    enum: ['one_time', 'retainer', 'monthly_maintenance'],
    default: 'one_time',
  },
  startDate: { type: Date },
  deadline: { type: Date },
  liveUrl: { type: String },
  stagingUrl: { type: String },
  techStack: [{ type: String }],
  onboardingDone: [{ type: String }],
  notes: { type: String },
  color: { type: String, default: '#4f46e5' },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
