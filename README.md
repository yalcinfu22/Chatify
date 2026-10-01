# Chatify

A WhatsApp-inspired chat application with direct messages, group chats, media attachments and online presence. Built with React, Node.js, Express, MongoDB and Socket.IO.

## Features

- Register and log in with JWT authentication and bcrypt password hashing.
- Start direct chats by username or phone number, or join groups through invite codes.
- Send text, images, GIFs and supported video attachments; delete your own messages.
- Receive live messages, presence updates and group events through Socket.IO.
- Manage group names and pictures, with file uploads up to 15 MB.

## How It Works

The backend separates routes, controllers, services and repositories. Services coordinate chat and message operations; repositories handle Mongoose queries. Related database writes use MongoDB transactions.

Messages are first saved through the REST API, then sent to connected clients through Socket.IO. React contexts manage authentication and socket state. A new socket connection replaces the user's previous connection.

The main code is in [`backend/services`](backend/services), [`backend/repository`](backend/repository), [`backend/socket.js`](backend/socket.js) and [`frontend/src`](frontend/src).

**Stack:** Express 5, MongoDB/Mongoose, Socket.IO 4, JWT, bcrypt, Multer and express-validator on the backend; React 18 and Vite 5 on the frontend. Upstash Redis provides separate rate limits for guests and authenticated users.

## Run Locally

You will need Node.js, npm, a MongoDB deployment with transaction support, and an [Upstash Redis](https://upstash.com/) database. Use MongoDB Atlas or a local replica set; a standalone MongoDB instance cannot run the transaction-based chat and message operations.

### Backend

```bash
git clone https://github.com/yalcinfu22/Chatify.git
cd Chatify/backend
npm ci
```

Create `backend/.env` with your own values:

```env
PORT=3001
URL=<your-mongodb-connection-string>
SECRET=<your-long-random-jwt-secret>
UPSTASH_REDIS_REST_URL=<your-upstash-rest-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>
```

Keep `.env` out of version control. The backend checks its MongoDB and Redis connections during startup.

From `backend/`, run:

```bash
npm run dev
```

### Frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The API and socket server run at `http://localhost:3001`.

These addresses are currently set in [`api.js`](frontend/src/services/api.js), [`SocketContext.jsx`](frontend/src/contexts/SocketContext.jsx) and the backend CORS configuration. Update them together if you change the hostnames or ports.

## Development Notes

- HTTP endpoints are defined in [`backend/routes`](backend/routes). Authenticated requests use `token: <JWT>`; socket connections pass the token in `auth.token`.
- `npm start` runs the backend without nodemon. The frontend provides `npm run build`, `npm run preview` and `npm run lint`.
- Automated tests are not configured. The root and backend `npm test` scripts are placeholders that exit with an error.
- ZEGO video-call code is partially implemented; its route is currently disabled. Read receipts and push notifications remain planned features.

To try the main flow, create two accounts in separate browser profiles, exchange messages, then create a group and join it with an invite code.

## Author and License

Author: Furkan.

ISC — personal project.
