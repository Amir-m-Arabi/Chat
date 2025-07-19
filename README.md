# Chat Server 🗨️

A production‑ready **Node.js**/**TypeScript** backend that delivers real‑time private, group, and channel messaging via **Socket.io** and persists data in **MySQL** with **Prisma ORM**.  
The project exposes a fully documented REST/JSON API with **Express 5** and **Swagger**, validates users with **JWT**, and supports rich‑media file uploads.

> **Scope:** This repository contains the **server‑side** code only. A client (web/mobile/desktop) must be implemented separately.

---

## Features

- **User & Admin Authentication** – Email/password sign‑up & login, JWT access/refresh tokens, role‑based guards
- **Email Verification** – Time‑limited 6‑digit OTP sent via **Nodemailer** (Gmail SMTP by default)
- **Private Chats** – Direct message threads supporting text, files, images, audio & video
- **Group Chats** – Create groups, manage members & roles, send broadcast messages
- **Channels / Broadcast Lists** – One‑way or admin‑only channels that users can **follow**
- **File Storage** – Upload any common MIME type through **Multer** with size/type validation
- **Real‑Time Updates** – Presence & typing indicators, message receipts, online/offline events
- **API Documentation** – Auto‑generated Swagger UI available at `/api-docs`
- **Notifications (Optional)** – Out‑of‑band alerts via **Telegram Bot API**
- **Logging & Error Handling** – `morgan` in development, centralised error middleware in production
- **Testing** – Jest unit & integration specs (coverage > 80 %, WIP)

---

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Runtime       | Node.js 20 LTS                     |
| Language      | TypeScript 5                       |
| Web Framework | Express 5                          |
| Realtime      | Socket.io v4                       |
| ORM           | Prisma 5 (MySQL connector)         |
| Database      | MySQL 8 / MariaDB 10.5+            |
| Auth          | JSON Web Tokens (access & refresh) |
| Mail          | Nodemailer (Gmail SMTP example)    |
| Docs          | Swagger‑UI‑Express                 |
| Tests         | Jest + Supertest                   |
| Dev Tools     | ts-node-dev · ESLint · Prettier    |

---

## Prerequisites

- **Node.js ≥ 20**
- **npm** or **Yarn**
- **MySQL 8** (or compatible MariaDB)
- A Gmail account for SMTP (or other SMTP creds)
- (Optional) Telegram Bot token for push alerts

---

## Getting Started

```bash
# 1) Clone the repository
git clone https://github.com/Amir-m-Arabi/Chat.git
cd Chat

# 2) Install dependencies
npm install          # or: yarn

# 3) Environment variables
cp .env.example .env
# → Fill out .env with your own secrets

# 4) Bootstrap the database
npx prisma migrate dev --name init
npm run seed         # optional: initial data

# 5) Start the server (development mode)
npm start            # ts-node-dev with hot‑reload

# Server: http://localhost:4000
# Swagger: http://localhost:4000/api-docs
```

### `.env` example

```dotenv
# General
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="mysql://USER:PASS@127.0.0.1:3306/chat_db"

# JWT
JWT_ACCESS_SECRET="change-me"
JWT_REFRESH_SECRET="change-me"
ACCESS_TOKEN_LIFETIME="15m"
REFRESH_TOKEN_LIFETIME="7d"

# SMTP (Gmail)
SMTP_USER="your@gmail.com"
SMTP_PASS="app-password"

# Telegram (optional)
TELEGRAM_BOT_TOKEN=""
```

> **Security Tip:** Never commit `.env` or any credential to a public repository.

---

## Project Structure

```
├── prisma/                 # schema.prisma + seed scripts
├── src/
│   ├── config/             # env & app configuration
│   ├── controllers/        # request handlers (users, chats, groups…)
│   ├── middlewares/        # auth, validation, error handling
│   ├── routes/             # Express route definitions
│   ├── services/           # reusable business logic (email, storage…)
│   ├── sockets/            # Socket.io event handlers
│   ├── helpers/            # helpers
│   └── server.ts           # app entry point
└── swagger.ts              # Swagger auto‑generation
```

---

## Socket.io Event Reference

| Event               | Direction       | Payload                        | Description                  |
| ------------------- | --------------- | ------------------------------ | ---------------------------- |
| `join_chat`         | client → server | `{ chatId }`                   | Join a private chat room     |
| `leave_chat`        | client → server | `{ chatId }`                   | Leave the private chat room  |
| `chat_message`      | client ↔ server | `{ chatId, content, type }`    | Send/receive a message in DM |
| `join_group`        | client → server | `{ groupId }`                  | Join a group room            |
| `leave_group`       | client → server | `{ groupId }`                  | Leave the group room         |
| `group_message`     | client ↔ server | `{ groupId, content, type }`   | Send/receive a group message |
| `join_channel`      | client → server | `{ channelId }`                | Subscribe to a channel       |
| `leave_channel`     | client → server | `{ channelId }`                | Unsubscribe from channel     |
| `channel_broadcast` | server → client | `{ channelId, content, type }` | Receive a broadcast message  |
| `typing`            | client → server | `{ roomId, isTyping }`         | Typing indicator             |
| `presence_change`   | server → client | `{ userId, online }`           | Online/offline presence      |

---

## NPM Scripts

| Command           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `npm start`       | Launch dev server with hot reload          |
| `npm run build`   | Compile TypeScript to `dist/`              |
| `npm run prod`    | Start compiled app (`node dist/server.js`) |
| `npm run prisma`  | Run seed script                            |
| `npm run swagger` | Regenerate Swagger spec                    |
| `npm test`        | Run Jest test suite                        |

---

## Development Workflow

1. **Fork** the repo & create a feature branch.
2. Follow the **ESLint** & **Prettier** guidelines (`npm run lint --fix`).
3. Submit a **pull request** with a clear description.

---

## Roadmap

- [ ] Complete test coverage (unit + e2e)
- [ ] Message search & pagination
- [ ] WebSocket authentication refresh flow
- [ ] Docker Compose for easy deployment
- [ ] Optional Redis adapter for horizontal scaling

---

## Security & Responsible Disclosure

If you discover a vulnerability, please email **amir.m.arabi@example.com** or open a private GitHub security advisory **before** filing a public issue.

---

## License

This project is licensed under the **ISC License** – see the [LICENSE](LICENSE) file for details.
