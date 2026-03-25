import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeLog extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  description?: string;
  billable: boolean;
  invoiceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimeLogSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  hours: { type: Number, required: true },
  description: { type: String },
  billable: { type: Boolean, default: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
}, { timestamps: true });

export default mongoose.models.TimeLog || mongoose.model<ITimeLog>('TimeLog', TimeLogSchema);
