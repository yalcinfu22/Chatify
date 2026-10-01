# Chatify

A WhatsApp-inspired real-time chat application built with React, Node.js, Express, MongoDB and Socket.IO. It supports direct messages, group chats with invite codes, media attachments and online presence.

The backend separates HTTP handlers, business logic and database access. Chat and message workflows use MongoDB transactions to coordinate related writes, while Socket.IO delivers live updates to connected clients.

## Features

- **Accounts:** registration, login and token verification with JWT; password hashing with bcrypt.
- **Direct chats:** start a conversation using a username or phone number.
- **Group chats:** create a group, join through an invite code, leave, rename it and update its picture.
- **Messages:** send text, images, GIFs and supported video attachments; delete your own messages.
- **Live updates:** incoming messages, online/offline presence and group events through Socket.IO.
- **Connection management:** a new socket connection replaces the user's previous connection.
- **Request handling:** input validation, separate guest and authenticated-user rate limits, and uploads up to 15 MB.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, Express 5, Mongoose, MongoDB |
| Real-time communication | Socket.IO 4 |
| Authentication and requests | JWT, bcrypt, express-validator, Multer |
| Rate limiting | Upstash Redis and `@upstash/ratelimit` |
| Frontend | React 18, Vite 5, socket.io-client |
| UI libraries | emoji-picker-react, react-hot-toast |

## Architecture

HTTP requests follow `routes → controllers → services → repository → MongoDB`.

- **Controllers** read requests and format responses.
- **Services** implement chat, user, message and attachment workflows, including transaction boundaries.
- **Repositories** contain Mongoose queries and accept transaction sessions where needed.
- **Socket.IO** manages chat rooms and live notifications. In the message flow, the client first saves a message through the REST API, then emits the returned message through the socket connection.
- **React contexts** hold authentication and socket state; the shared API client adds the token to HTTP requests.

```text
Chatify/
├── backend/
│   ├── config/          # Environment loading and rate-limit configuration
│   ├── controllers/    # HTTP request handlers
│   ├── middlewares/    # Uploads and rate limiting
│   ├── models/         # User, Chat, Message and Image schemas
│   ├── repository/     # Database access
│   ├── routes/         # /users and /chats endpoints
│   ├── services/       # Business logic
│   ├── uploads/        # Files stored on disk
│   ├── socket.js       # Socket authentication, rooms and event handlers
│   └── index.js        # Server startup
└── frontend/src/
    ├── components/     # Authentication, chat screens and modals
    ├── contexts/       # Authentication and socket state
    ├── services/       # REST API client
    └── styles/         # Application CSS
```

## Getting Started

### Prerequisites

- Node.js and npm.
- A MongoDB deployment that supports transactions, such as MongoDB Atlas or a local replica set. A standalone MongoDB instance is insufficient for transaction-based chat and message operations.
- An [Upstash Redis](https://upstash.com/) database with a REST URL and token. The backend checks this connection during startup.

### 1. Clone and install

```bash
git clone https://github.com/yalcinfu22/Chatify.git
cd Chatify/backend
npm ci
```

### 2. Configure the backend

Create `backend/.env` with your own connection details:

```env
PORT=3001
URL=<your-mongodb-connection-string>
SECRET=<your-long-random-jwt-secret>
UPSTASH_REDIS_REST_URL=<your-upstash-rest-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>
```

The backend reads these names directly. Keep `.env` out of version control.

From `backend/`, start the API:

```bash
npm run dev
```

### 3. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The API and socket server use `http://localhost:3001`.

These URLs are currently set in the frontend API client and socket context, and the backend CORS configuration allows the two local origins. Keep those settings aligned if you change the ports or hostnames.

## API Overview

Authenticated HTTP requests use the custom header `token: <JWT>`. Socket connections pass the JWT in `auth.token` during the handshake.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/users/register` | Register, with an optional profile picture |
| POST | `/users/login` | Log in with a username and password |
| POST | `/users/verify` | Verify the current token |
| GET | `/chats` | List the current user's chats |
| GET / DELETE | `/chats/:chatId` | View or delete a chat |
| POST | `/chats/direct` | Start a direct chat |
| POST | `/chats/group` | Create a group |
| POST | `/chats/join` | Join using an invite code |
| DELETE | `/chats/:chatId/members/me` | Leave a group |
| PATCH | `/chats/:chatId/group-name` | Rename a group |
| PATCH | `/chats/:chatId/group-picture` | Update a group picture |
| GET / POST | `/chats/:chatId/messages` | Fetch the latest 50 messages or send one |
| DELETE | `/chats/:chatId/messages/:messageId` | Delete a message |

All `/chats` routes and `/users/verify` require a token. Registration and message uploads use `multipart/form-data` when a file is included.

## Scripts and Checks

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start with nodemon |
| `backend/` | `npm start` | Start with Node.js |
| `frontend/` | `npm run dev` | Start the Vite development server |
| `frontend/` | `npm run build` | Build the frontend |
| `frontend/` | `npm run preview` | Preview a frontend build |
| `frontend/` | `npm run lint` | Run the configured ESLint command |

An automated test suite is not configured. The backend and root `npm test` scripts are placeholders that exit with an error.

To check the main flow locally, create two accounts in separate browser profiles, start a direct chat, exchange text and media, then create a group and join it with its invite code. Check presence changes when either account disconnects.

## Roadmap

- Automated tests for authentication, chat membership and message workflows.
- Video calls: ZEGO-related code exists, but the video-call route is currently commented out.
- Message read receipts.
- Push notifications.

## Author and License

Author: Furkan, as recorded in `package.json`.

ISC — personal project.

