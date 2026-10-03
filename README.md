# VoidAI Public Catalog

This Next.js site serves the public VoidAI model catalog and links to the separate API service documentation. It does not implement accounts, authentication, API-key management, model inference, or local database storage.

## Run Locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The `/models` page loads the model list through `/api/models`, which fetches from `https://api.voidai.app/v1/models`.

## Deploy on Vercel

Import the repository into Vercel and use the detected Next.js settings. No MongoDB or PostgreSQL database, Prisma generation, auth secrets, or payment credentials are required by this site. The deployment must be able to make outbound HTTPS requests to `api.voidai.app` for the catalog to load.

Model inference and any access requirements or pricing are handled by the separate VoidAI API service. See [VoidAI API documentation](https://docs.voidai.app).