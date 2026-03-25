import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  year: number;
  lastNumber: number;
}

const CounterSchema: Schema = new Schema({
  year: { type: Number, required: true, unique: true },
  lastNumber: { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);
