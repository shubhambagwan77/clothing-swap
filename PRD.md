# Product Requirements Document: ClothingSwap

**Project:** Clothing Exchange & Swap Marketplace
**Author:** Shubham Bagwan
**Organisation:** Unified Mentor Pvt Ltd (internship project)

## 1. Overview

Fast fashion has increased clothing consumption and textile waste. Many people own wearable clothes they no longer use but find selling or donating inconvenient. ClothingSwap lets users exchange clothes directly with other users, without payment, and promotes a barter based, sustainable fashion community.

## 2. Problem statement

- People have unused clothes but no easy way to exchange them.
- E-commerce and resale platforms focus on buying and selling, and pricing can be complicated.
- There are few platforms dedicated to clothing swaps.
- Sustainable fashion options are limited for many users.

## 3. Goals

**Primary**
- Provide a marketplace dedicated to clothing exchange.
- Let users swap directly without any money transaction.
- Encourage sustainable fashion habits.
- Provide location based swap matching.

**Secondary**
- Negotiation between users before a swap is final.
- Estimated swap value and fairness suggestions.
- Filter by category and location.
- Courier based swaps for remote users (users arrange this in chat in Phase 1).
- Build a community around sustainable fashion.

## 4. Users

| User | Needs |
| --- | --- |
| Swapper | List clothes, find items nearby, negotiate fair swaps |
| Admin | Keep the platform safe, remove bad listings, resolve disputes, view analytics |

## 5. Scope

**In scope (Phase 1):** registration and login, listings, swap requests, negotiation chat, value calculator, location based suggestions, admin panel.

**Out of scope (Phase 1):** online payments, AI recommendations, AR try-on, mobile app.

## 6. Functional requirements

**User module**
- Register and log in; create and edit a profile (name, city, phone).
- Upload listings with size, brand, type and condition.
- Browse items; send swap requests; view swap history.

**Listing module**
- Upload a photo and details; estimated value is calculated automatically and can be adjusted.
- Availability status: available, reserved, swapped.
- Edit or remove own listings.

**Swap request module**
- Offer one of your items for another user's item.
- Owner can accept or reject; requester can cancel; either side can complete or cancel an accepted swap.
- Status tracking: pending, accepted, rejected, cancelled, completed.
- When a swap is accepted both items are reserved and conflicting pending requests are rejected.

**Negotiation chat**
- Direct messages between the two users of a swap; refreshed automatically.
- Contact details are revealed only after acceptance to protect privacy.

**Swap value calculator**
- Value = base price of clothing type x brand factor x condition factor.
- Fairness check compares both items: fair swap (within 20%), slightly uneven (within 40%), uneven.
- The swap page suggests the user's items closest in value.

**Location based matching**
- Each user and listing has a city; distance is calculated between cities (haversine formula).
- Filter by city and show items within 50, 150, 300 or 1000 km of the user.

**Admin module**
- Manage users (suspend or reinstate) and listings (remove).
- Monitor all swaps and open their chats.
- Resolve disputes: users report listings; admin dismisses the report or removes the listing.
- Analytics: users, listings, swaps, successful swaps, active users, engagement and conversion.

## 7. Non-functional requirements

- Secure authentication: bcrypt password hashing, JWT with 7 day expiry, login rate limiting, helmet headers.
- Input validation on client and server; users can only change their own data.
- Mobile responsive layout.
- Indexed queries and server side filtering for fast browsing.
- Images are resized in the browser before upload to keep requests small.
- Stateless API so the app can scale horizontally.

## 8. Architecture

React single page app (Vite) talks to an Express REST API over JSON. The API uses Mongoose models stored in MongoDB Atlas. In production one Node service on Render serves both the API and the built React files.

**Collections:** users, listings, swaps, messages, reports.

| Collection | Main fields |
| --- | --- |
| users | name, email, password hash, phone, city, role, banned |
| listings | title, type, category, brand, size, condition, description, image, estimatedValue, city, owner, status |
| swaps | requester, owner, requestedItem, offeredItem, message, status |
| messages | swap, sender, text |
| reports | listing, reporter, reason, status, resolution |

## 9. User flow

1. Register or log in.
2. Create a profile and list clothes.
3. Browse listings near me.
4. Open an item and send a swap request with one of my items.
5. Negotiate in the chat.
6. Owner accepts; both users exchange the items locally or by courier.
7. Either user marks the swap as completed.

**Admin flow:** view analytics, review reports, manage listings and users, monitor swaps.

## 10. KPIs

- Number of clothing listings
- Number of successful swaps
- User engagement rate (active users / all users in 30 days)
- Swap request conversion rate (accepted or completed / all requests)
- Active users on the platform

## 11. Assumptions and constraints

- Users are willing to exchange clothes and upload accurate information.
- Quality of items depends on users; fairness depends on negotiation.
- Shipping cost may influence decisions and is arranged between users.
- Phase 1 has no payment gateway.

## 12. Risks

| Risk | Mitigation |
| --- | --- |
| Fake or inappropriate listings | Report option and admin removal |
| Privacy of contact details | Shown only after both users agree to a swap |
| Unfair swaps | Value calculator and fairness label |
| Password guessing | Rate limiting and hashed passwords |

## 13. Deliverables

- Working marketplace with listing, browsing, swap request, negotiation chat, location matching and admin panel
- Live deployed link
- This PRD document

## 14. Future enhancements

- AI based swap recommendations
- Mobile application
- Clothing condition verification
- Sustainability impact tracker
- Community fashion groups
