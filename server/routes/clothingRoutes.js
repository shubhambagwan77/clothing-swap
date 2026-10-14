import express from "express";
import Clothing from "../models/clothing.js";

const router = express.Router();

// Get all clothes
router.get("/", async (req, res) => {
    console.log("GET CLOTHES ROUTE HIT");
  try {
    const clothes = await Clothing.find().sort({ createdAt: -1 });
    res.json(clothes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new clothing
router.post("/", async (req, res) => {
  try {
    const clothing = new Clothing({
      item: req.body.item,
      category: req.body.category,
      image: req.body.image || "",
      description: req.body.description || "",
      owner: req.body.owner || "Anonymous",
    });

    const savedClothing = await clothing.save();
    res.status(201).json(savedClothing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Clothing.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
export default router;
