import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunication extends Document {
  clientId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'call' | 'email' | 'meeting' | 'note' | 'whatsapp';
  subject: string;
  body: string;
  date: Date;
  followUpDate?: Date;
  createdAt: Date;
}

const CommunicationSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['call', 'email', 'meeting', 'note', 'whatsapp'], required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    date: { type: Date, required: true },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Communication || mongoose.model<ICommunication>('Communication', CommunicationSchema);
