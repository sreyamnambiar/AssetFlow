import mongoose from "mongoose";

/**
 * Valid statuses an asset can hold throughout its lifecycle.
 */
export const ASSET_STATUSES = ["Available", "Assigned", "Maintenance", "Retired", "Allocated"];

/**
 * Valid asset categories for the organisation.
 * Extend this list as needed.
 */
export const ASSET_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Printer",
  "Phone",
  "Tablet",
  "Server",
  "Networking",
  "Furniture",
  "Vehicle",
  "Other",
];

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    assetCode: {
      type: String,
      required: [true, "Asset code is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ASSET_CATEGORIES,
        message: "Invalid category: {VALUE}",
      },
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ASSET_STATUSES,
        message: "Invalid status: {VALUE}",
      },
      default: "Available",
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: [0, "Purchase price cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for full-text search on name and assetCode
assetSchema.index({ name: "text", assetCode: "text" });

// Regular indexes for common filter fields
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ location: 1 });

const Asset =
  mongoose.models.AssetRecord || mongoose.model("AssetRecord", assetSchema);

export default Asset;