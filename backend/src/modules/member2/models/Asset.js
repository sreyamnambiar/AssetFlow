import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    assetCode: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
    },
    location: {
      type: String,
    },
    status: {
      type: String,
      default: "Available",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;