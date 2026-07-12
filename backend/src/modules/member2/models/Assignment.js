import mongoose from "mongoose";

/**
 * Assignment Model
 *
 * Tracks the allocation of an asset to an employee/user.
 * When an assignment is active, the linked asset's status is set to "Assigned".
 * When returned, the asset status reverts to "Available".
 *
 * File: src/modules/member2/models/Assignment.js
 */

export const ASSIGNMENT_STATUSES = ["Active", "Returned"];

const assignmentSchema = new mongoose.Schema(
  {
    /**
     * The asset being assigned.
     */
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetRecord",
      required: [true, "Asset reference is required"],
    },

    /**
     * The employee or user receiving the asset.
     * Stored as an ObjectId if your auth system has a User model;
     * kept as a plain string here so member2 is decoupled from member1's User model.
     * Change to `ref: 'User'` if you want population.
     */
    employee: {
      type: String,
      required: [true, "Employee name or ID is required"],
      trim: true,
    },

    /**
     * Date the asset was handed over.
     */
    assignedDate: {
      type: Date,
      required: [true, "Assigned date is required"],
      default: Date.now,
    },

    /**
     * Expected or actual return date. Optional at creation time.
     */
    returnDate: {
      type: Date,
      default: null,
    },

    /**
     * The user (name or ID from JWT) who created this assignment.
     */
    assignedBy: {
      type: String,
      required: [true, "assignedBy is required"],
      trim: true,
    },

    /**
     * Current lifecycle status of the assignment.
     */
    status: {
      type: String,
      enum: {
        values: ASSIGNMENT_STATUSES,
        message: "Invalid assignment status: {VALUE}",
      },
      default: "Active",
    },

    /**
     * Optional notes about the assignment.
     */
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast look-up of all assignments for a given asset
assignmentSchema.index({ asset: 1 });
// Index for filtering by status
assignmentSchema.index({ status: 1 });

const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
