import mongoose, { Document, Model, Schema } from 'mongoose';

export type OrgRole = 'owner' | 'admin' | 'member';

export interface IMembership extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  role: OrgRole;
  joinedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Role hierarchy: owner > admin > member */
export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function hasMinimumRole(userRole: OrgRole, required: OrgRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique: one active membership per user per org
MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
MembershipSchema.index({ organizationId: 1 });
MembershipSchema.index({ userId: 1 });
MembershipSchema.index({ organizationId: 1, role: 1 });

const Membership: Model<IMembership> =
  mongoose.models.Membership ??
  mongoose.model<IMembership>('Membership', MembershipSchema);

export default Membership;
