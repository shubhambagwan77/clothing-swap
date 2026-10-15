// Shared constants and small helpers (value calculator, distance)

export const CATEGORIES = ["Men", "Women", "Kids", "Accessories"];
export const CONDITIONS = ["New with tags", "Like new", "Good", "Fair"];
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Kids 2-4Y", "Kids 5-8Y", "Kids 9-12Y"];

// base value (INR) for each clothing type
export const TYPE_BASE = {
  "T-Shirt": 300,
  "Shirt": 400,
  "Jeans": 700,
  "Trousers": 600,
  "Shorts": 300,
  "Kurta": 600,
  "Saree": 1200,
  "Dress": 900,
  "Skirt": 400,
  "Ethnic Set": 2000,
  "Jacket": 1300,
  "Hoodie": 800,
  "Sweater": 700,
  "Shoes": 1000,
  "Bag": 900,
  "Accessory": 300,
  "Kids Wear": 350,
};
export const TYPES = Object.keys(TYPE_BASE);

const PREMIUM = ["nike", "adidas", "levis", "levi's", "zara", "uniqlo", "tommy hilfiger", "calvin klein", "ralph lauren", "gucci", "marks & spencer"];
const MID = ["h&m", "puma", "biba", "fabindia", "allen solly", "peter england", "van heusen", "us polo", "wrangler", "jack & jones", "max", "pantaloons", "manyavar", "w", "global desi", "reebok", "lee"];

const CONDITION_FACTOR = {
  "New with tags": 1,
  "Like new": 0.8,
  "Good": 0.6,
  "Fair": 0.4,
};

function brandFactor(brand) {
  const b = (brand || "").trim().toLowerCase();
  if (!b || b === "unbranded" || b === "none" || b === "local") return 0.8;
  if (PREMIUM.includes(b)) return 2.2;
  if (MID.includes(b)) return 1.5;
  return 1;
}

// Estimate swap value in rupees from type, brand and condition
export function calculateValue({ type, brand, condition }) {
  const base = TYPE_BASE[type] || 300;
  const cond = CONDITION_FACTOR[condition] || 0.6;
  const value = base * brandFactor(brand) * cond;
  return Math.max(50, Math.round(value / 10) * 10);
}

// Compare the value of two items and say how fair the swap is
export function compareValues(a, b) {
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const ratio = high === 0 ? 1 : low / high;
  let label = "Uneven swap";
  if (ratio >= 0.8) label = "Fair swap";
  else if (ratio >= 0.6) label = "Slightly uneven";
  return { difference: high - low, ratio: Number(ratio.toFixed(2)), label };
}

export const CITIES = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Nashik", lat: 19.9975, lng: 73.7898 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Indore", lat: 22.7196, lng: 75.8577 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
];
export const CITY_NAMES = CITIES.map((c) => c.name);

export function findCity(name) {
  return CITIES.find((c) => c.name.toLowerCase() === String(name || "").toLowerCase());
}

// Haversine distance in km between two cities
export function distanceBetween(cityA, cityB) {
  const a = findCity(cityA);
  const b = findCity(cityB);
  if (!a || !b) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}
