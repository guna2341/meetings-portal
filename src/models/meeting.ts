import mongoose, { Document, Model, Schema } from 'mongoose';

// ─── Sub-document interfaces ───────────────────────────────────────────────

export interface IAttendee {
  name: string;
  email: string;
  status: 'accepted' | 'declined' | 'pending';
}

export interface ITask {
  title: string;
  assignedTo: string;
  dueDate: Date;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

export interface INote {
  author: string;
  content: string;
  timestamp: Date;
}

export interface IOrganizer {
  name: string;
  email: string;
}

// ─── Main document interface ───────────────────────────────────────────────

export interface IMeeting extends Document {
  title: string;
  description?: string;
  date: Date;
  time: string;
  duration: string;
  location?: string;
  building?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  organizer: IOrganizer;
  attendees: IAttendee[];
  agenda: string[];
  tasks: ITask[];
  notes: INote[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ──────────────────────────────────────────────────

const AttendeeSchema = new Schema<IAttendee>(
  {
    name: {
      type: String,
      required: [true, 'Attendee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Attendee email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    status: {
      type: String,
      enum: {
        values: ['accepted', 'declined', 'pending'],
        message: 'Status must be accepted, declined, or pending',
      },
      default: 'pending',
    },
  },
  { _id: true }
);

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    assignedTo: {
      type: String,
      required: [true, 'Task must be assigned to someone'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Task due date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['completed', 'in-progress', 'pending'],
        message: 'Task status must be completed, in-progress, or pending',
      },
      default: 'pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: 'Priority must be high, medium, or low',
      },
      default: 'medium',
    },
  },
  { _id: true }
);

const NoteSchema = new Schema<INote>(
  {
    author: {
      type: String,
      required: [true, 'Note author is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const OrganizerSchema = new Schema<IOrganizer>(
  {
    name: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Organizer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
  },
  { _id: false }
);

// ─── Main Meeting schema ───────────────────────────────────────────────────

const MeetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },
    time: {
      type: String,
      required: [true, 'Meeting time is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Meeting duration is required'],
      trim: true,
      default: '60 min',
    },
    location: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'completed', 'cancelled'],
        message: 'Status must be upcoming, completed, or cancelled',
      },
      default: 'upcoming',
    },
    organizer: {
      type: OrganizerSchema,
      required: [true, 'Meeting organizer is required'],
    },
    attendees: {
      type: [AttendeeSchema],
      default: [],
    },
    agenda: {
      type: [String],
      default: [],
    },
    tasks: {
      type: [TaskSchema],
      default: [],
    },
    notes: {
      type: [NoteSchema],
      default: [],
    },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────

MeetingSchema.index({ date: 1 });
MeetingSchema.index({ status: 1 });
MeetingSchema.index({ 'organizer.email': 1 });
MeetingSchema.index({ 'attendees.email': 1 });
MeetingSchema.index({ title: 'text', description: 'text' }); // full-text search

// ─── Virtuals ─────────────────────────────────────────────────────────────

MeetingSchema.virtual('attendeeCount').get(function (this: IMeeting) {
  return this.attendees.length;
});

MeetingSchema.virtual('completedTaskCount').get(function (this: IMeeting) {
  return this.tasks.filter((t) => t.status === 'completed').length;
});

MeetingSchema.virtual('isUpcoming').get(function (this: IMeeting) {
  return this.status === 'upcoming' && new Date(this.date) > new Date();
});

// ─── Export model (Next.js hot-reload safe) ────────────────────────────────

const Meeting: Model<IMeeting> =
  mongoose.models.Meeting ?? mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;