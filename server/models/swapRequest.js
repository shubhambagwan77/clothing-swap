import mongoose from "mongoose";

const swapSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestedItem: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    offeredItem: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Swap", swapSchema);
