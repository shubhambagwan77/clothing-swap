import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Listing from "./models/clothing.js";
import Swap from "./models/swapRequest.js";
import Message from "./models/message.js";
import { calculateValue } from "./utils/constants.js";

// Fills an empty database with an admin, demo users and realistic listings
const users = [
  ["Aarav Sharma", "aarav@example.com", "Pune", "9822012345"],
  ["Priya Patil", "priya@example.com", "Pune", "9890123456"],
  ["Rohan Mehta", "rohan@example.com", "Mumbai", "9820234567"],
  ["Sneha Iyer", "sneha@example.com", "Bengaluru", "9845345678"],
  ["Kabir Singh", "kabir@example.com", "Delhi", "9811456789"],
  ["Ananya Reddy", "ananya@example.com", "Hyderabad", "9849567890"],
  ["Meera Nair", "meera@example.com", "Kochi", "9847678901"],
  ["Vikram Joshi", "vikram@example.com", "Nashik", "9823789012"],
];

// [owner index, title, type, category, brand, size, condition, description]
const items = [
  [0, "Levi's 511 Slim Fit Jeans", "Jeans", "Men", "Levi's", "L", "Good", "Dark blue slim fit jeans, worn a few times. No tears, waist 32."],
  [0, "Allen Solly Formal Shirt", "Shirt", "Men", "Allen Solly", "M", "Like new", "Light blue cotton formal shirt, worn once for an interview."],
  [0, "Nike Running Shoes", "Shoes", "Men", "Nike", "L", "Good", "UK size 9 running shoes, sole in good shape."],
  [1, "Biba Cotton Kurta", "Kurta", "Women", "Biba", "M", "Like new", "Printed yellow cotton kurta, suitable for office and festivals."],
  [1, "Zara Floral Summer Dress", "Dress", "Women", "Zara", "S", "Good", "Knee length floral dress, light fabric, very comfortable."],
  [1, "Handloom Silk Saree", "Saree", "Women", "Unbranded", "Free Size", "Good", "Maroon silk saree with gold border, blouse piece included."],
  [2, "H&M Oversized Hoodie", "Hoodie", "Men", "H&M", "XL", "Good", "Grey fleece hoodie, warm and soft, small mark on sleeve."],
  [2, "Wrangler Denim Jacket", "Jacket", "Men", "Wrangler", "L", "Good", "Classic blue denim jacket, buttons intact."],
  [2, "Puma Printed T-Shirt", "T-Shirt", "Men", "Puma", "M", "Like new", "Black sports t-shirt with white logo."],
  [3, "Fabindia Cotton Kurta Set", "Ethnic Set", "Women", "Fabindia", "M", "Like new", "Kurta with palazzo, off-white with blue block print."],
  [3, "Uniqlo Light Sweater", "Sweater", "Women", "Uniqlo", "S", "Good", "Beige knit sweater, no pilling."],
  [3, "Leather Sling Bag", "Bag", "Accessories", "Unbranded", "Free Size", "Good", "Brown faux leather sling bag with two zip pockets."],
  [4, "US Polo Assn Polo T-Shirt", "T-Shirt", "Men", "US Polo", "L", "Like new", "Navy polo t-shirt, worn twice."],
  [4, "Peter England Trousers", "Trousers", "Men", "Peter England", "L", "Good", "Grey formal trousers, waist 34, recently dry cleaned."],
  [4, "Adidas Track Jacket", "Jacket", "Men", "Adidas", "M", "Good", "Black track jacket with white stripes."],
  [5, "Pantaloons Printed Skirt", "Skirt", "Women", "Pantaloons", "S", "Like new", "Midi skirt with small floral print."],
  [5, "W Anarkali Kurta", "Kurta", "Women", "W", "L", "Good", "Green anarkali style kurta, gently used."],
  [5, "Silver Jhumka Earrings Set", "Accessory", "Accessories", "Unbranded", "Free Size", "New with tags", "Oxidised silver jhumkas, never worn."],
  [6, "Kids Cotton Frock", "Kids Wear", "Kids", "Unbranded", "Kids 5-8Y", "Good", "Pink cotton frock for a 6 year old, outgrown."],
  [6, "Kids Denim Dungaree", "Kids Wear", "Kids", "Max", "Kids 2-4Y", "Good", "Soft denim dungaree, easy buttons."],
  [6, "Handloom Cotton Saree", "Saree", "Women", "Unbranded", "Free Size", "Like new", "Kerala off-white saree with golden kasavu border."],
  [7, "Jack & Jones Slim Jeans", "Jeans", "Men", "Jack & Jones", "M", "Fair", "Faded black jeans, small wear at hem."],
  [7, "Manyavar Nehru Jacket", "Jacket", "Men", "Manyavar", "L", "Like new", "Cream festive Nehru jacket, worn for one wedding."],
  [7, "Canvas Backpack", "Bag", "Accessories", "Unbranded", "Free Size", "Good", "Olive canvas backpack with laptop sleeve."],
];

export default async function seedIfEmpty() {
  if (await User.findOne({ role: "admin" })) return;
  console.log("Empty database found, adding admin account and demo data...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@clothingswap.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  await User.create({
    name: "Admin",
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 10),
    city: "Pune",
    role: "admin",
  });

  const demoHash = await bcrypt.hash("Demo@123", 10);
  const created = [];
  for (const [name, email, city, phone] of users) {
    created.push(await User.create({ name, email, password: demoHash, city, phone }));
  }

  const listings = [];
  for (const [ownerIndex, title, type, category, brand, size, condition, description] of items) {
    const owner = created[ownerIndex];
    listings.push(
      await Listing.create({
        title, type, category, brand, size, condition, description,
        estimatedValue: calculateValue({ type, brand, condition }),
        city: owner.city,
        owner: owner._id,
      })
    );
  }

  // two sample swaps so the dashboard and chat are not empty
  const pending = await Swap.create({
    requester: created[1]._id,
    owner: created[0]._id,
    requestedItem: listings[0]._id,
    offeredItem: listings[4]._id,
    message: "Hi Aarav, I would like to swap my Zara dress for your Levi's jeans. Is that fine?",
  });
  await Message.create({ swap: pending._id, sender: created[1]._id, text: pending.message });

  const accepted = await Swap.create({
    requester: created[2]._id,
    owner: created[4]._id,
    requestedItem: listings[14]._id,
    offeredItem: listings[6]._id,
    message: "Would you swap the Adidas jacket for my H&M hoodie?",
    status: "accepted",
  });
  await Listing.updateMany({ _id: { $in: [listings[14]._id, listings[6]._id] } }, { status: "reserved" });
  await Message.create({ swap: accepted._id, sender: created[2]._id, text: accepted.message });
  await Message.create({ swap: accepted._id, sender: created[4]._id, text: "Sounds good. I am in Delhi, are you okay with courier?" });
  await Message.create({ swap: accepted._id, sender: created[2]._id, text: "Yes, I will ship it this weekend." });

  console.log("Demo data added. Admin login: " + adminEmail);
}
