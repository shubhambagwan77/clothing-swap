import mongoose from "mongoose";

const clothingSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    owner: {
      type: String,
      default: "Anonymous",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Clothing", clothingSchema);