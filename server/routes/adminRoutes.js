import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Listing from "../models/clothing.js";
import Swap from "../models/swapRequest.js";
import Message from "../models/message.js";
import Report from "../models/report.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(auth, adminOnly);

function bad(res, id) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ message: "Not found" });
    return true;
  }
  return false;
}

// Platform analytics and KPIs
router.get("/stats", async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [users, listings, available, swaps, accepted, completed, openReports] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: "available" }),
      Swap.countDocuments(),
      Swap.countDocuments({ status: "accepted" }),
      Swap.countDocuments({ status: "completed" }),
      Report.countDocuments({ status: "open" }),
    ]);

    // users who listed, requested, received a request or chatted in the last 30 days
    const [listers, requesters, owners, chatters] = await Promise.all([
      Listing.distinct("owner", { createdAt: { $gte: since } }),
      Swap.distinct("requester", { createdAt: { $gte: since } }),
      Swap.distinct("owner", { createdAt: { $gte: since } }),
      Message.distinct("sender", { createdAt: { $gte: since } }),
    ]);
    const activeSet = new Set([...listers, ...requesters, ...owners, ...chatters].map(String));

    const byCategory = await Listing.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byStatus = await Swap.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

    res.json({
      users,
      listings,
      availableListings: available,
      swaps,
      successfulSwaps: completed,
      acceptedSwaps: accepted,
      openReports,
      activeUsers: activeSet.size,
      engagementRate: users ? Math.round((activeSet.size / users) * 100) : 0,
      conversionRate: swaps ? Math.round(((accepted + completed) / swaps) * 100) : 0,
      byCategory,
      byStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    const counts = await Listing.aggregate([{ $group: { _id: "$owner", count: { $sum: 1 } } }]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json(users.map((u) => ({ ...u, listingCount: map[String(u._id)] || 0 })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    if (bad(res, req.params.id)) return;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Admin accounts cannot be changed" });
    user.banned = Boolean(req.body.banned);
    await user.save();
    res.json({ _id: user._id, banned: user.banned });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/listings", async (req, res) => {
  try {
    const items = await Listing.find().populate("owner", "name email city").sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/swaps", async (req, res) => {
  try {
    const swaps = await Swap.find()
      .populate("requestedItem", "title")
      .populate("offeredItem", "title")
      .populate("requester", "name")
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("listing", "title image status")
      .populate("reporter", "name")
      .sort({ status: -1, createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resolve a dispute: dismiss the report or remove the listing
router.patch("/reports/:id", async (req, res) => {
  try {
    if (bad(res, req.params.id)) return;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const { action, note } = req.body;
    if (!["dismiss", "remove_listing"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }
    if (action === "remove_listing") {
      await Swap.updateMany(
        { status: { $in: ["pending", "accepted"] }, $or: [{ requestedItem: report.listing }, { offeredItem: report.listing }] },
        { status: "cancelled" }
      );
      await Listing.findByIdAndDelete(report.listing);
    }
    report.status = "resolved";
    report.resolution = (note || (action === "remove_listing" ? "Listing removed" : "Report dismissed")).trim();
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
