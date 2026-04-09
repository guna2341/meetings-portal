import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IConversation extends Document {
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];
  meetingId?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      optional: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ?? mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
