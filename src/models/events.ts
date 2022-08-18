import mongoose, { Schema } from 'mongoose';

interface Location {
  type: string;
  coordinates: number[];
}

export interface IEvent {
  title: string;
  desc: string;
  start: Date;
  end: Date;
  registeredParticipants: number;
  maxParticipants: number;
  location: Location;
}

const EventSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  desc: {
    type: String,
    required: [true, 'Description is required'],
  },
  start: {
    type: Date,
    required: [true, 'Start Date is required'],
  },
  end: {
    type: Date,
    required: [true, 'End Date is required'],
  },
  registeredParticipants: {
    type: Number,
    required: [true, '# of registered participants is required'],
    default: 0,
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Max # of participants is required'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: [true, 'Location is required'],
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

export default mongoose.model<IEvent>('event', EventSchema);
