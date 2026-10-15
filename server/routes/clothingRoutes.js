import express from "express";
import mongoose from "mongoose";
import Listing from "../models/clothing.js";
import Swap from "../models/swapRequest.js";
import Report from "../models/report.js";
import { auth, optionalAuth } from "../middleware/auth.js";
import {
  CATEGORIES, CONDITIONS, SIZES, TYPES, CITY_NAMES,
  calculateValue, compareValues, distanceBetween,
} from "../utils/constants.js";

const router = express.Router();

function validate(body) {
  const { title, type, category, size, condition, city, image } = body;
  if (!title || title.trim().length < 3) return "Title must be at least 3 characters";
  if (!TYPES.includes(type)) return "Choose a valid clothing type";
  if (!CATEGORIES.includes(category)) return "Choose a valid category";
  if (!SIZES.includes(size)) return "Choose a valid size";
  if (!CONDITIONS.includes(condition)) return "Choose a valid condition";
  if (!CITY_NAMES.includes(city)) return "Choose a valid city";
  if (image && (!image.startsWith("data:image/") || image.length > 2_500_000)) {
    return "Image must be a picture under about 2 MB";
  }
  return null;
}

// Browse listings with filters. ?near=Pune adds distance and ?maxKm=300 limits it
router.get("/", async (req, res) => {
  try {
    const { category, city, q, condition, size, near, maxKm, sort, status } = req.query;
    const filter = { status: status || "available" };
    if (category && category !== "All") filter.category = category;
    if (city && city !== "All") filter.city = city;
    if (condition && condition !== "All") filter.condition = condition;
    if (size && size !== "All") filter.size = size;
    if (q) {
      const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: new RegExp(safe, "i") },
        { brand: new RegExp(safe, "i") },
        { type: new RegExp(safe, "i") },
      ];
    }

    let items = await Listing.find(filter)
      .populate("owner", "name city")
      .sort({ createdAt: -1 })
      .lean();

    if (near) {
      items = items.map((i) => ({ ...i, distanceKm: distanceBetween(near, i.city) }));
      if (maxKm) items = items.filter((i) => i.distanceKm !== null && i.distanceKm <= Number(maxKm));
      if (sort === "near") items.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }
    if (sort === "value") items.sort((a, b) => b.estimatedValue - a.estimatedValue);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// My own listings
router.get("/mine", auth, async (req, res) => {
  try {
    const items = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Item not found" });
    }
    const item = await Listing.findById(req.params.id).populate("owner", "name city createdAt").lean();
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (req.user) item.distanceKm = distanceBetween(req.user.city, item.city);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Suggest which of my items would make a fair swap for this item
router.get("/:id/matches", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Item not found" });
    }
    const target = await Listing.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "Item not found" });

    const mine = await Listing.find({ owner: req.user._id, status: "available" }).lean();
    const matches = mine
      .map((m) => ({ ...m, fairness: compareValues(m.estimatedValue, target.estimatedValue) }))
      .sort((a, b) => a.fairness.difference - b.fairness.difference);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const b = req.body;
    const computed = calculateValue(b);
    const custom = Number(b.estimatedValue);
    const value = custom > 0 && custom <= 100000 ? Math.round(custom) : computed;

    const item = await Listing.create({
      title: b.title.trim(),
      type: b.type,
      category: b.category,
      brand: (b.brand || "Unbranded").trim(),
      size: b.size,
      condition: b.condition,
      description: (b.description || "").trim(),
      image: b.image || "",
      estimatedValue: value,
      city: b.city,
      owner: req.user._id,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Item not found" });
    }
    const item = await Listing.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.owner) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit your own listings" });
    }
    if (item.status !== "available") {
      return res.status(400).json({ message: "This item is part of a swap and cannot be edited" });
    }

    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const b = req.body;
    const custom = Number(b.estimatedValue);
    item.title = b.title.trim();
    item.type = b.type;
    item.category = b.category;
    item.brand = (b.brand || "Unbranded").trim();
    item.size = b.size;
    item.condition = b.condition;
    item.description = (b.description || "").trim();
    item.city = b.city;
    if (b.image !== undefined) item.image = b.image;
    item.estimatedValue = custom > 0 && custom <= 100000 ? Math.round(custom) : calculateValue(b);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Item not found" });
    }
    const item = await Listing.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.owner) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }
    if (item.status === "reserved") {
      return res.status(400).json({ message: "Cancel the accepted swap before deleting this item" });
    }

    // pending requests that involve this item can no longer go ahead
    await Swap.updateMany(
      { status: "pending", $or: [{ requestedItem: item._id }, { offeredItem: item._id }] },
      { status: "cancelled" }
    );
    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Report a listing to the admin
router.post("/:id/report", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Item not found" });
    }
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ message: "Please describe the problem (at least 5 characters)" });
    }
    const item = await Listing.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const already = await Report.findOne({ listing: item._id, reporter: req.user._id, status: "open" });
    if (already) return res.status(409).json({ message: "You have already reported this item" });

    await Report.create({ listing: item._id, reporter: req.user._id, reason: reason.trim() });
    res.status(201).json({ message: "Report sent to the admin" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
