import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { auth, signToken } from "../middleware/auth.js";
import { CITY_NAMES } from "../utils/constants.js";

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  return { _id: u._id, name: u.name, email: u.email, phone: u.phone, city: u.city, role: u.role };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, city, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    if (!email || !emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!CITY_NAMES.includes(city)) {
      return res.status(400).json({ message: "Please choose your city" });
    }
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid phone number" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "This email is already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email,
      password: hashed,
      city,
      phone: phone || "",
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ message: "Wrong email or password" });
    if (user.banned) return res.status(403).json({ message: "This account has been suspended" });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", auth, (req, res) => {
  res.json(publicUser(req.user));
});

router.put("/me", auth, async (req, res) => {
  try {
    const { name, city, phone } = req.body;
    if (name !== undefined) {
      if (name.trim().length < 2) return res.status(400).json({ message: "Name is too short" });
      req.user.name = name.trim();
    }
    if (city !== undefined) {
      if (!CITY_NAMES.includes(city)) return res.status(400).json({ message: "Invalid city" });
      req.user.city = city;
    }
    if (phone !== undefined) {
      if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
        return res.status(400).json({ message: "Enter a valid phone number" });
      }
      req.user.phone = phone;
    }
    await req.user.save();
    res.json(publicUser(req.user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
