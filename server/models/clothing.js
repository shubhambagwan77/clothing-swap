import mongoose from "mongoose";

// Collection is named "listings" so old test data in "clothings" is left alone
const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, default: "Unbranded", trim: true },
    size: { type: String, required: true },
    condition: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    estimatedValue: { type: Number, required: true },
    city: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["available", "reserved", "swapped"], default: "available" },
  },
  { timestamps: true }
);

export default mongoose.model("Listing", listingSchema);
