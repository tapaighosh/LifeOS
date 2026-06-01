import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Principle — a short guiding statement shown to the user in daily rotation.
 *
 * Principles are cycled via the spaced-repetition scheduler:
 *  - `show_order` determines the shuffle order (0 … N-1).
 *  - `last_shown` (ISO date string) lets the scheduler skip recently displayed entries.
 *  - `active` supports soft-delete so user data is never permanently lost.
 */
export interface IPrinciple extends Document {
  heading: string;
  body: string;
  show_order: number;
  last_shown: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrincipleSchema: Schema<IPrinciple> = new Schema(
  {
    heading: {
      type: String,
      required: [true, 'Heading is required'],
      trim: true,
      maxlength: [120, 'Heading cannot exceed 120 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      maxlength: [500, 'Body cannot exceed 500 characters'],
    },
    show_order: {
      type: Number,
      required: [true, 'show_order is required'],
    },
    last_shown: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for scheduler queries: find the principle least recently shown
PrincipleSchema.index({ last_shown: 1 });

// Index for ordered retrieval / display rotation
PrincipleSchema.index({ show_order: 1 });

const Principle: Model<IPrinciple> =
  mongoose.models.Principle ||
  mongoose.model<IPrinciple>('Principle', PrincipleSchema);

export default Principle;
