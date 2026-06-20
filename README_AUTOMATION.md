This README documents automated scaffolding added by the assistant.

Next steps to run locally (manual):

1. Create a PostgreSQL database and set `DATABASE_URL` in `.env`.
2. Run Prisma migrate and seed:

```bash
npx prisma migrate dev --name init
node prisma/seed.js # or ts node if using ts
```

3. Install dependencies and run Next.js:

```bash
npm install
npm run dev
```

Notes:
- Many endpoints are placeholders and need production hardening (SSE, file uploads, auth checks).

4. Run unit tests (validations):

```bash
npm run test
```
