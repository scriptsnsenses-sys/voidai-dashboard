# Internal use only.

## Deploying on Vercel

Import this repository into Vercel and keep the detected Next.js framework and build settings. Prisma Client is generated during dependency installation.

Add these environment variables to the Vercel project before deploying:

- `MONGODB_URL` for account and authentication data.
- `POSTGRESQL_URI` for the Prisma-backed API-key and usage database.
- `JWT_SECRET` set to a unique, randomly generated secret.
- `HCAPTCHA_SECRET_KEY` for registration verification.
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` configured for the deployed domain.
- `NEXT_PUBLIC_SITE_URL` set to the deployed site origin, such as `https://your-domain.example`.

`V2_MONGODB_URL` is needed for redeem-code features, and `USAGES_MONGODB_CONNECTION_STRING` is needed for the separate usage-history database. Configure these only when those features are enabled. Do not add Stripe keys: paid checkout and payment-intent creation are disabled.

Vercel functions must be able to reach the configured databases over the network. After deployment, verify registration, login, API-key creation, and model-list loading against the production databases.

The information provided below, as well as this entire project, source code, etc, is strictly confidential, sharing this project without proper authorization may result in being permanently removed from it.

# What is this?

This is the source code for the voidai dashboard, it aims to provide functionality for:

 - Managing API Keys
 - Purchasing plans
 - Redeeming gift codes
 - Tracking usage

As well as internally:
 
 - Banning users
 - Managing user plans
 - Managing Anthropic applications
 - Viewing users' contact information

A live instance of it should always be available at https://voidai.app/dashboard

This code is internally licensed as [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0), all forks, etc, must abide by it.
