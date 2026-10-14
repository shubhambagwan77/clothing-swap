import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
console.log("Mongo URI loaded:", !!process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Atlas connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
  mongoose.connection.on("connected", () => {
  console.log("MongoDB connection event: connected");
});
import clothingRoutes from "./routes/clothingRoutes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/clothes", clothingRoutes);
app.get("/api/test", (req, res) => {
  res.json({ message: "Main server route working!" });
});

app.get("/", (req, res) => {
  res.json({
    message: "ClothingSwap backend is running!"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});