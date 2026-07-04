# Memory Mirror

Memory Mirror is a hackathon MVP for reflecting across your own saved memories. Add notes, chats, journal entries, link notes, and voice memo transcripts, then ask questions like "What am I avoiding?" or "What should I do next this week?"

## Getting Started

Install dependencies and generate Prisma Client:

```bash
npm install
npx prisma generate
```

Create `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
BTL_API_KEY="..."
BTL_BASE_URL="https://api.badtheorylabs.com/v1"
BTL_MODEL="btl-2"
```

Run the database migration and start the app:

```bash
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## BTL Runtime

All generated reflections go through `src/lib/btl/client.ts`, which calls the BTL Runtime chat completions endpoint with `BTL_MODEL`. The API key is only read on the server.

## Two-minute demo

1. Click **Load demo memories**.
2. Ask **What am I avoiding?**
3. Review the answer, evidence snippets, and next action.
4. Ask **What should I do this weekend?**
5. Use the concrete plan generated from the saved memories.

## Stack

Next.js App Router, TypeScript, Prisma/Postgres, Server Actions, Route Handlers, Ant Design, TanStack Query, Axios, Tailwind CSS, Framer Motion, and Zod.
