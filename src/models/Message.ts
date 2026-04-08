import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: false,
      default: '',
    },
    imageUrl: {
      type: String,
      required: false,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexing for faster retrieval
MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
