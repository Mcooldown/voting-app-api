# Voting App API

A RESTful API for a voting application built with **Node.js**, **Express**, and **MongoDB**. Implements JWT-based authentication, role-based access control (admin / user), and full TDD coverage with **Jest** + **Supertest**.

---

## Requirements

- **Node.js** v18+
- **npm** v9+
- A MongoDB Atlas cluster (or any MongoDB instance — URI provided via `.env`)

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url> voting-app-api
cd voting-app-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local .env   # or edit .env directly

# 4. Start the server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port the HTTP server listens on (default: `5000`) |
| `MONGODB_URI` | Full MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | JWT lifetime (e.g. `7d`, `24h`) |

---

## Running the Server

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

Server will be available at `http://localhost:5000`.

---

## Running Tests

The test suite uses **Jest** + **Supertest** + **mongodb-memory-server** (no real DB connection required).

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```
