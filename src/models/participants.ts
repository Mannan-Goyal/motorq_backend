import mongoose, { Schema } from 'mongoose';

export interface IParticipant {
  uname: string;
  pass: string;
  events: string[];
}

const ParticipantSchema = new Schema({
  uname: {
    type: String,
    required: [true, 'Username is required'],
  },
  pass: {
    type: String,
    required: [true, 'Password is required'],
  },
  events: {
    type: [String],
    default: [],
  },
});

export default mongoose.model<IParticipant>('participant', ParticipantSchema);
