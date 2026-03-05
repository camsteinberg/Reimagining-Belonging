This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Google Sheets Integration

This dashboard can pull data from a Google Sheet using a service account. Create a `.env.local` file (or use Vercel environment variables) with the following values:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account@project.iam.gserviceaccount.com>
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=<your-sheet-id>
GOOGLE_SHEET_RANGE=<sheet-name-and-range>
```

### Can't create a service account key?

If your organization restricts service account keys, try these options:

1. **Request access** – Ask your Google Cloud admin to generate the key or grant you permission.
2. **Use an existing key** – Some teams keep a shared service account key. Check if your admin can provide it securely.
3. **Consider OAuth credentials** – Use OAuth 2.0 user credentials instead of a service account. Tokens will need periodic refresh.
4. **Ask about other authorized methods** – Your organization may support keyless options like Workload Identity Federation or a proxy solution.

Your security or admin team can advise which method is approved and help you complete the setup.
