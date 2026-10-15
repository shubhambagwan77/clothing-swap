import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not set");
    }
    return "dev-only-secret-change-me";
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign({ id: user._id }, getSecret(), { expiresIn: "7d" });
}

async function userFromRequest(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), getSecret());
    const user = await User.findById(payload.id).select("-password");
    if (!user || user.banned) return null;
    return user;
  } catch {
    return null;
  }
}

// Login required
export async function auth(req, res, next) {
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ message: "Please log in to continue" });
  req.user = user;
  next();
}

// Login optional (used on public pages)
export async function optionalAuth(req, res, next) {
  req.user = await userFromRequest(req);
  next();
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
}
