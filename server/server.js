import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import clothingRoutes from "./routes/clothingRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import seedIfEmpty from "./seed.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// slow down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: "Too many attempts, please try again in a few minutes" },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/clothes", clothingRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);
app.get("/api/test", (req, res) => res.json({ message: "Main server route working!" }));

app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

// In production the built React app is served from the same server
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res) => res.sendFile(path.join(dist, "index.html")));
} else {
  app.get("/", (req, res) => res.json({ message: "ClothingSwap backend is running!" }));
}

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Image is too large, please use a smaller picture" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Add it to your .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas connected successfully!");
    await seedIfEmpty();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log("Server running on port " + PORT));
}

start();
