# VoidAI Public Catalog

This Next.js site serves the public VoidAI model catalog and provides an OpenAI-compatible proxy to the separate VoidAI API service. It does not implement accounts, authentication, API-key management, local model inference, or local database storage.

## Run Locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The `/models` page loads the catalog, and API clients can use this site as an OpenAI-compatible base URL:

```text
https://<your-deployment>/v1
```

Supported routes include `GET /v1/models` and `POST /v1/chat/completions`. The chat proxy forwards authorization and request data to the backend, streams its response, and preserves its status, headers, and body. Backend errors are returned as errors, not as assistant/chat content. If the backend cannot be reached, the proxy responds with HTTP `502` and an OpenAI-style error object.

## Deploy on Vercel

Import the repository into Vercel and use the detected Next.js settings. No MongoDB or PostgreSQL database, Prisma generation, auth secrets, or payment credentials are required by this site. The deployment must be able to make outbound HTTPS requests to `voidai-backend.onrender.com` for the catalog to load.

Model inference and any access requirements or pricing are handled by the separate VoidAI API service. Successful chat completions require credentials accepted by that service. See [VoidAI API documentation](https://docs.voidai.app).