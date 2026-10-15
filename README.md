# ClothingSwap - Clothing Exchange & Swap Marketplace

A web platform where people swap clothes they no longer wear instead of buying new ones. Users list items, browse clothes near them, send swap requests, negotiate in a chat and complete the exchange. An admin panel handles moderation and analytics.

Built as part of the internship project at Unified Mentor Pvt Ltd.

**Live link:** _add your Render URL here_

## Features

- Register / login with hashed passwords (bcrypt) and JWT sessions
- List clothes with photo, type, brand, size, condition, city and description
- Estimated swap value calculated from type, brand and condition
- Browse with search, category, condition, size and city filters
- Location based matching: show items near my city within a chosen distance
- Item detail page with owner, distance and report option
- Swap request: offer one of your items, with a fairness check on both values
- Accept, reject, cancel and complete swaps; track status
- Negotiation chat between the two users (contact details are shown only after acceptance)
- User dashboard: my listings, requests received and sent, profile
- Admin panel: analytics and KPIs, manage users, remove listings, monitor swaps, resolve reports

## Pages

| Route | Page |
| --- | --- |
| `/login` | Login and registration |
| `/` | Clothing listings with filters |
| `/item/:id` | Item detail |
| `/swap/:id` | Swap request |
| `/chat/:id` | Negotiation chat |
| `/dashboard` | User dashboard |
| `/sell`, `/sell/:id` | Add or edit a listing |
| `/admin` | Admin panel |

## Tech stack

- Frontend: React 19, React Router, Vite, plain CSS
- Backend: Node.js, Express 5
- Database: MongoDB Atlas with Mongoose
- Security: bcryptjs, JSON Web Tokens, helmet, rate limiting on auth routes, input validation
- Deployment: Render (one service serves the API and the built React app)

## Run locally

1. Install Node.js 20 or newer.
2. Install packages: `npm install`
3. Create a `.env` file in the project root:
   ```
   MONGODB_URI=your MongoDB Atlas connection string
   JWT_SECRET=any long random string
   ```
4. Start the API: `npm run server` (port 5000)
5. In a second terminal start the frontend: `npm run dev` (port 5173)

On the first start with an empty database the app creates an admin account and realistic demo data.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@clothingswap.com | Admin@123 |
| Demo user | aarav@example.com | Demo@123 |

Change the admin password after deployment by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first start.

## Deploy on Render

1. Push this project to GitHub (the `.env` file must not be uploaded).
2. In MongoDB Atlas open Network Access and allow `0.0.0.0/0`.
3. On Render create a new Web Service from the repository.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
4. Add environment variables `MONGODB_URI` and `JWT_SECRET`.
5. Deploy and open the Render URL.

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | Create account, log in |
| GET, PUT | `/api/auth/me` | Current user, update profile |
| GET | `/api/clothes` | Browse with filters, `near` and `maxKm` for distance |
| GET | `/api/clothes/:id`, `/api/clothes/mine`, `/api/clothes/:id/matches` | Detail, my items, fair swap matches |
| POST, PUT, DELETE | `/api/clothes`, `/api/clothes/:id` | Create, edit, delete listing |
| POST | `/api/clothes/:id/report` | Report a listing |
| POST, GET | `/api/swaps` | Send request, list my swaps |
| PATCH | `/api/swaps/:id/status` | Accept, reject, cancel, complete |
| GET, POST | `/api/swaps/:id/messages` | Chat messages |
| GET, PATCH | `/api/admin/...` | Stats, users, listings, swaps, reports |

## Project structure

```
server/        Express API (models, routes, middleware, seed data)
src/           React app (pages, components, auth context)
render.yaml    Render deployment settings
PRD.md         Product requirements document
```
