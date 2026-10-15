import express from "express";
import mongoose from "mongoose";
import Swap from "../models/swapRequest.js";
import Listing from "../models/clothing.js";
import Message from "../models/message.js";
import { auth } from "../middleware/auth.js";
import { compareValues } from "../utils/constants.js";

const router = express.Router();
router.use(auth);

const ITEM_FIELDS = "title image size brand condition estimatedValue city status category type";

function populateSwap(query) {
  return query
    .populate("requestedItem", ITEM_FIELDS)
    .populate("offeredItem", ITEM_FIELDS)
    .populate("requester", "name city phone email")
    .populate("owner", "name city phone email");
}

// Shape a swap for the client. Contact details are shown only after acceptance
function swapView(swap) {
  const s = swap.toObject();
  if (!["accepted", "completed"].includes(s.status)) {
    for (const key of ["requester", "owner"]) {
      if (s[key]) {
        delete s[key].phone;
        delete s[key].email;
      }
    }
  }
  if (s.requestedItem && s.offeredItem) {
    s.fairness = compareValues(s.requestedItem.estimatedValue, s.offeredItem.estimatedValue);
  }
  return s;
}

function isParticipant(swap, user) {
  const id = String(user._id);
  const ownerId = String(swap.owner._id || swap.owner);
  const requesterId = String(swap.requester._id || swap.requester);
  return id === ownerId || id === requesterId;
}

async function loadSwap(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: "Swap not found" });
    return null;
  }
  const swap = await populateSwap(Swap.findById(req.params.id));
  if (!swap) {
    res.status(404).json({ message: "Swap not found" });
    return null;
  }
  if (!isParticipant(swap, req.user) && req.user.role !== "admin") {
    res.status(403).json({ message: "This swap is not yours" });
    return null;
  }
  return swap;
}

// Send a swap request: I offer one of my items for someone else's item
router.post("/", async (req, res) => {
  try {
    const { requestedItem, offeredItem, message } = req.body;
    if (!mongoose.isValidObjectId(requestedItem) || !mongoose.isValidObjectId(offeredItem)) {
      return res.status(400).json({ message: "Choose the item you want and the item you offer" });
    }

    const wanted = await Listing.findById(requestedItem);
    if (!wanted) return res.status(404).json({ message: "Item not found" });
    if (wanted.status !== "available") {
      return res.status(400).json({ message: "This item is no longer available" });
    }
    if (String(wanted.owner) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot request your own item" });
    }

    const offered = await Listing.findById(offeredItem);
    if (!offered || String(offered.owner) !== String(req.user._id)) {
      return res.status(400).json({ message: "You can only offer your own items" });
    }
    if (offered.status !== "available") {
      return res.status(400).json({ message: "The item you offered is not available" });
    }

    const duplicate = await Swap.findOne({
      requestedItem, offeredItem, requester: req.user._id, status: "pending",
    });
    if (duplicate) {
      return res.status(409).json({ message: "You already sent this request" });
    }

    const swap = await Swap.create({
      requester: req.user._id,
      owner: wanted.owner,
      requestedItem,
      offeredItem,
      message: (message || "").trim().slice(0, 500),
    });

    // the first chat message is the note sent with the request
    if (swap.message) {
      await Message.create({ swap: swap._id, sender: req.user._id, text: swap.message });
    }

    const full = await populateSwap(Swap.findById(swap._id));
    res.status(201).json(swapView(full));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// All swaps I am part of (sent and received)
router.get("/", async (req, res) => {
  try {
    const swaps = await populateSwap(
      Swap.find({ $or: [{ requester: req.user._id }, { owner: req.user._id }] }).sort({ updatedAt: -1 })
    );
    res.json(swaps.map(swapView));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const swap = await loadSwap(req, res);
    if (swap) res.json(swapView(swap));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change status:
//  owner     : pending -> accepted | rejected
//  requester : pending -> cancelled
//  either    : accepted -> completed | cancelled
router.patch("/:id/status", async (req, res) => {
  try {
    const swap = await loadSwap(req, res);
    if (!swap) return;

    const { status } = req.body;
    const me = String(req.user._id);
    const isOwner = me === String(swap.owner._id);
    const isRequester = me === String(swap.requester._id);
    const current = swap.status;

    const allowed =
      (status === "accepted" && isOwner && current === "pending") ||
      (status === "rejected" && isOwner && current === "pending") ||
      (status === "cancelled" && isRequester && current === "pending") ||
      (status === "cancelled" && (isOwner || isRequester) && current === "accepted") ||
      (status === "completed" && (isOwner || isRequester) && current === "accepted");

    if (!allowed) {
      return res.status(400).json({ message: "That change is not allowed for this swap" });
    }

    const ids = [swap.requestedItem._id, swap.offeredItem._id];

    if (status === "accepted") {
      // both items must still be free
      const busy = await Listing.countDocuments({ _id: { $in: ids }, status: { $ne: "available" } });
      if (busy > 0) {
        return res.status(400).json({ message: "One of the items is no longer available" });
      }
      await Listing.updateMany({ _id: { $in: ids } }, { status: "reserved" });
      // other open requests that use these items cannot be honoured now
      await Swap.updateMany(
        {
          _id: { $ne: swap._id },
          status: "pending",
          $or: [{ requestedItem: { $in: ids } }, { offeredItem: { $in: ids } }],
        },
        { status: "rejected" }
      );
    }
    if (status === "completed") {
      await Listing.updateMany({ _id: { $in: ids } }, { status: "swapped" });
    }
    if (status === "cancelled" && current === "accepted") {
      await Listing.updateMany({ _id: { $in: ids } }, { status: "available" });
    }

    swap.status = status;
    await swap.save();
    const full = await populateSwap(Swap.findById(swap._id));
    res.json(swapView(full));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Negotiation chat
router.get("/:id/messages", async (req, res) => {
  try {
    const swap = await loadSwap(req, res);
    if (!swap) return;
    const messages = await Message.find({ swap: swap._id })
      .populate("sender", "name")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/messages", async (req, res) => {
  try {
    const swap = await loadSwap(req, res);
    if (!swap) return;
    if (!isParticipant(swap, req.user)) {
      return res.status(403).json({ message: "Only the two users can chat here" });
    }
    if (["rejected", "cancelled"].includes(swap.status)) {
      return res.status(400).json({ message: "This swap is closed" });
    }
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Message cannot be empty" });
    if (text.length > 1000) return res.status(400).json({ message: "Message is too long" });

    const msg = await Message.create({ swap: swap._id, sender: req.user._id, text });
    await msg.populate("sender", "name");
    res.status(201).json(msg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
