# Chatify

A real-time chat application inspired by WhatsApp. Direct messages, group chats with invite codes, file/image attachments, and live online status — built end-to-end with Node.js, MongoDB, Socket.IO, and React.

---

## Features

- **Authentication** — register, login, and session verification with JWT
- **Direct chats** — start a 1-to-1 chat by username or phone number
- **Group chats** — create groups, join via invite code, leave, rename, update group picture
- **Messaging** — send text + file attachments, delete messages
- **Real-time** — Socket.IO for live messages, presence (`online` / `offline` / `onCall`), and group join events
- **Single session per user** — logging in elsewhere disconnects the previous session
- **Rate limiting** — separate limiters for guest (auth) and authenticated (chat) routes
- **File uploads** — Multer pipelines for profile picture, group picture, and message attachments
- **Admin** — Socket.IO Admin UI for live socket inspection

---

## Tech Stack

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO 4
- JSON Web Tokens (`jsonwebtoken`)
- bcrypt
- Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
- Multer
- express-validator
- consola

**Frontend**
- React 18
- Vite 5
- socket.io-client
- emoji-picker-react
- react-hot-toast

---

## Project Structure

```
Whatsapp-Clone/
├── backend/
│   ├── config/            # env loader
│   ├── controllers/       # request handlers (auth, user, chat, message, validation)
│   ├── middlewares/       # upload, rate limiters
│   ├── models/            # Mongoose schemas (User, Chat, Message, Image)
│   ├── repository/        # DB access layer
│   ├── routes/            # /users, /chats
│   ├── serializers/       # response shaping
│   ├── services/          # business logic
│   ├── utils/             # auth, jwt helper, transaction
│   ├── uploads/           # runtime upload storage (gitignored)
│   ├── redis.js           # Upstash client + connect
│   ├── socket.js          # Socket.IO server + handlers
│   ├── socketManager.js   # io instance accessor
│   ├── system.js          # bootstraps the system user
│   └── index.js           # entrypoint
└── frontend/
    └── src/
        ├── components/    # Auth, Chat (Sidebar/MainChat/ChatArea), Modals
        ├── contexts/      # AuthContext, SocketContext
        ├── services/      # api.js (REST client)
        ├── styles/        # CSS
        └── utils/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local instance or a connection URL)
- An [Upstash Redis](https://upstash.com/) database (REST URL + token)

### 1. Clone

```bash
git clone <repo-url>
cd Whatsapp-Clone
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
URL=mongodb://localhost:27017/whatsapp-clone
SECRET=your-jwt-secret

UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Optional — only if enabling ZEGO video calls
APP_ID=
VIDEO_SECRET=
```

Run:

```bash
npm run dev      # nodemon
# or
npm start        # node
```

Server listens on `http://localhost:3001`.

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

App opens at `http://localhost:5173`.

---

## API Overview

Base URL: `http://localhost:3001`

### Users (`/users`)

| Method | Path        | Auth | Description                              |
|--------|-------------|------|------------------------------------------|
| POST   | `/register` | —    | Register (multipart, optional avatar)    |
| POST   | `/login`    | —    | Login with username + password           |
| POST   | `/verify`   | JWT  | Verify token & return current user       |

### Chats (`/chats`) — all routes require a JWT

| Method | Path                              | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/`                               | List the current user's chats        |
| GET    | `/:chatId`                        | Get chat details                     |
| DELETE | `/:chatId`                        | Delete a chat                        |
| POST   | `/direct`                         | Start a direct chat (by username/phone) |
| POST   | `/group`                          | Create a group chat                  |
| POST   | `/join`                           | Join a group via invite code         |
| DELETE | `/:chatId/members/me`             | Leave a group                        |
| PATCH  | `/:chatId/group-name`             | Rename a group                       |
| PATCH  | `/:chatId/group-picture`          | Update group picture                 |
| GET    | `/:chatId/messages`               | Fetch latest messages                |
| POST   | `/:chatId/messages`               | Send a message (multipart)           |
| DELETE | `/:chatId/messages/:messageId`    | Delete a message                     |

Auth header: `Authorization: Bearer <token>`

---

## Real-Time Events (Socket.IO)

Authentication is performed in the socket handshake via the same JWT.

**Client → Server**

| Event                      | Payload                          |
|----------------------------|----------------------------------|
| `user-create-direct-chat`  | `{ _id, members, creator }`      |
| `user-create-group-chat`   | `{ _id, ... }`                   |
| `user-join-group`          | `{ _id }`                        |
| `send-message`             | `{ chat_id, ... }`               |

**Server → Client**

| Event                      | Notes                                          |
|----------------------------|------------------------------------------------|
| `new-message`              | New message broadcast to chat room             |
| `user-status-changed`      | Presence updates (`online` / `offline`)        |
| `user-added-to-direct-chat`| Emitted to both participants                   |
| `user-joined-group`        | Notifies existing group members                |
| `session-replaced`         | Sent to the previous socket on a new login     |

---

## Scripts

**Backend** (`backend/`)
- `npm run dev` — nodemon
- `npm start` — node

**Frontend** (`frontend/`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — ESLint

---

## Roadmap

- Video calls (ZEGO integration scaffolded; route currently commented out in `chatRoutes.js`)
- Automated test suite
- Message read receipts
- Push notifications

---

## License

ISC — personal project.
