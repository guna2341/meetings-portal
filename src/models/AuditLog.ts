import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuditAction =
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'member.added'
  | 'member.removed'
  | 'member.role_changed'
  | 'invite.sent'
  | 'invite.accepted'
  | 'invite.declined'
  | 'invite.revoked'
  | 'invite.expired';

export interface IAuditLog extends Document {
  action: AuditAction;
  actorId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'org.created',
        'org.updated',
        'org.deleted',
        'member.added',
        'member.removed',
        'member.role_changed',
        'invite.sent',
        'invite.accepted',
        'invite.declined',
        'invite.revoked',
        'invite.expired',
      ],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // append-only log
  }
);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
