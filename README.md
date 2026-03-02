# Voting App API

A RESTful API for a voting application built with **Node.js**, **Express**, and **MongoDB**. Implements JWT-based authentication, role-based access control (admin / user), and full TDD coverage with **Jest** + **Supertest**.

---

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Voting](#voting)

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

# 3. Configure environment variables (see next section)
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

All tests are located in the `tests/` directory and follow the TDD approach (tests were written before implementation).

---

## Project Structure

```
voting-app-api/
├── src/
│   ├── app.js                  # Express app (no listen — imported by tests)
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── vote.controller.js
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── roles.js            # Role-based access (requireAdmin / requireUser)
│   │   └── validate.js         # express-validator error handler
│   ├── models/
│   │   ├── User.js             # User model (admin | user roles)
│   │   ├── Candidate.js        # Candidate model (name only)
│   │   └── Vote.js             # Vote model (userId + candidateId, unique on userId)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── vote.routes.js
│   ├── services/
│   │   ├── auth.service.js     # Login + JWT signing
│   │   ├── user.service.js     # CRUD operations for users
│   │   └── vote.service.js     # Voting + results logic ($lookup aggregation)
│   ├── utils/
│   │   └── logger.js           # Appends error stacks to logs/error.log
│   └── validators/
│       ├── auth.validator.js
│       ├── user.validator.js
│       └── vote.validator.js
├── tests/
│   ├── helpers/
│   │   └── db.helper.js        # In-memory MongoDB setup/teardown
│   ├── auth.test.js
│   ├── user.test.js
│   └── vote.test.js
├── logs/                       # Runtime error logs (git-ignored)
│   └── error.log
├── server.js                   # Entry point — loads .env and starts server
├── .env                        # Environment variables (do NOT commit)
├── .gitignore
├── package.json
└── README.md
```

---

## Local Development Accounts

The following accounts are pre-seeded in the local database for testing purposes.

**Admin**
| Field | Value |
|-------|-------|
| Name | `administrator` |
| Email | `administrator@yopmail.com` |
| Password | `Administrator123!` |

**Users**
| Name | Email | Password |
|------|-------|----------|
| user 2 | `user-2@yopmail.com` | `User2222!` |
| user 3 | `user-3@yopmail.com` | `User3333!` |

---

## API Reference

All JSON responses follow this envelope:

```json
{
  "success": true | false,
  "message": "...",
  "data": { ... }
}
```

Validation errors return HTTP **422** with an `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "A valid email is required" }]
}
```

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Liveness check |

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login (admin or user) |

#### POST `/api/auth/login`

**Request body:**
```json
{
  "email": "admin@example.com",
  "password": "Passw0rd!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT>",
    "user": { "_id": "...", "name": "Admin", "email": "...", "role": "admin" }
  }
}
```

---

### Users

All user endpoints require an **Admin JWT** (`Authorization: Bearer <token>`).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users` | Admin JWT | Create a new user (role always set to `"user"`) |
| GET | `/api/users` | Admin JWT | List all users |
| GET | `/api/users/:id` | Admin JWT | Get a user by ID |
| PUT | `/api/users/:id` | Admin JWT | Update a user's name |
| DELETE | `/api/users/:id` | Admin JWT | Delete a user |

#### POST `/api/users`

Creates a new user. The role is **always set to `"user"`** regardless of any `role` field in the request body — admins cannot be created through this endpoint.

**Password requirements:** minimum 8 characters, at least one uppercase letter, one number, and one symbol.

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Passw0rd!"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "user" }
  }
}
```

#### PUT `/api/users/:id`

Only the `name` field can be updated. Sending `email`, `role`, or `password` returns **422**.

**Request body:**
```json
{
  "name": "Jane Smith"
}
```

---

### Voting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/votes/candidates` | Any JWT | Same as above (alias) |
| POST | `/api/votes` | User JWT | Cast a vote |
| GET | `/api/votes/results` | Admin JWT | View full vote results and totals |

#### GET `/api/votes/candidates`

Returns all candidates **without** vote counts. Vote tallies are only visible to admins via `/api/votes/results`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "candidates": [
      { "_id": "...", "name": "Alice Smith" },
      { "_id": "...", "name": "Bob Johnson" }
    ]
  }
}
```

#### POST `/api/votes`

Voters (role `"user"`) can vote **once only**. The `candidate_name` can be an existing candidate or a new name (free text — it will be created automatically).

**Request body:**
```json
{
  "candidate_name": "Alice Smith"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Vote cast successfully for \"Alice Smith\"",
  "data": {
    "candidate": { "_id": "...", "name": "Alice Smith" }
  }
}
```

**Response `409`** — user already voted:
```json
{
  "success": false,
  "message": "You have already cast your vote"
}
```

#### GET `/api/votes/results` (Admin)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "total": 42,
    "candidates": [
      { "name": "Alice Smith", "voteCount": 25 },
      { "name": "Bob Johnson", "voteCount": 17 }
    ]
  }
}
```
