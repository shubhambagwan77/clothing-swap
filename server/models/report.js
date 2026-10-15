import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    resolution: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
