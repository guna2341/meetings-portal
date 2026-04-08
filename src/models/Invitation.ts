import mongoose, { Document, Model, Schema } from 'mongoose';
import type { OrgRole } from './Membership';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface IInvitation extends Document {
  email: string;
  organizationId: mongoose.Types.ObjectId;
  role: OrgRole;
  token: string;           // raw token (stored hashed, sent raw via link)
  status: InvitationStatus;
  expiresAt: Date;
  invitedBy: mongoose.Types.ObjectId;
  invitedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'revoked', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// One pending/active invite per email per org at a time
InvitationSchema.index(
  { email: 1, organizationId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);
InvitationSchema.index({ token: 1 }, { unique: true });
InvitationSchema.index({ organizationId: 1, status: 1 });
InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 }); // for TTL cleanup queries

const Invitation: Model<IInvitation> =
  mongoose.models.Invitation ??
  mongoose.model<IInvitation>('Invitation', InvitationSchema);

export default Invitation;
