import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast queries
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ createdBy: 1 });
OrganizationSchema.index({ isDeleted: 1 });

// Soft-delete helper
OrganizationSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

const Organization: Model<IOrganization> =
  mongoose.models.Organization ??
  mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
