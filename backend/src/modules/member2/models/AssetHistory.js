import mongoose from "mongoose";

/**
 * AssetHistory Model
 *
 * Immutable audit log. Every create / update / assign / return / delete
 * action on an asset appends one record here.
 *
 * File: src/modules/member2/models/AssetHistory.js
 */

export const HISTORY_ACTIONS = [
  "Created",
  "Updated",
  "Assigned",
  "Returned",
  "Deleted",
  "Allocated",
  "Transferred",
];

const assetHistorySchema = new mongoose.Schema(
  {
    /**
     * The asset this history record belongs to.
     * Stored as a plain ObjectId so the history survives even after the
     * asset document is deleted (soft reference).
     */
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetRecord",
      required: true,
      index: true,
    },

    /**
     * The type of action that generated this record.
     */
    action: {
      type: String,
      enum: {
        values: HISTORY_ACTIONS,
        message: "Invalid action: {VALUE}",
      },
      required: true,
    },

    /**
     * The user who performed the action.
     * Derived from req.user (JWT payload); stored as a string for simplicity.
     */
    performedBy: {
      type: String,
      default: "system",
    },

    /**
     * Arbitrary details about the change.
     * e.g. { before: { status: 'Available' }, after: { status: 'Assigned' } }
     */
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    /**
     * createdAt is the authoritative timestamp for history records.
     * updatedAt is not meaningful here (records are never updated).
     */
    timestamps: true,
  }
);

// Compound index: fetch history for an asset sorted by time
assetHistorySchema.index({ asset: 1, createdAt: -1 });

const AssetHistory =
  mongoose.models.AssetHistory ||
  mongoose.model("AssetHistory", assetHistorySchema);

export default AssetHistory;
