import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    swap: { type: mongoose.Schema.Types.ObjectId, ref: "Swap", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
