import express from "express";
import { CATEGORIES, CONDITIONS, SIZES, TYPES, CITY_NAMES, calculateValue } from "../utils/constants.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ categories: CATEGORIES, conditions: CONDITIONS, sizes: SIZES, types: TYPES, cities: CITY_NAMES });
});

// Live value preview used on the add-item form
router.post("/estimate", (req, res) => {
  const { type, brand, condition } = req.body;
  res.json({ estimatedValue: calculateValue({ type, brand, condition }) });
});

export default router;
