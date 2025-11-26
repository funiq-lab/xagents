const isProd = process.env.NODE_ENV === 'production'

const internalHost = process.env.TAURI_DEV_HOST || 'localhost'

/** @type {import('next').NextConfig} */
const nextConfig = {
// Ensure Next.js generates SSG output instead of SSR
// https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: 'export',
  // The Image component requires this flag when exporting a static app.
  // See https://nextjs.org/docs/messages/export-image-api for workarounds.
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix to ensure assets resolve correctly during dev
  assetPrefix: isProd ? undefined : `http://${internalHost}:8888`,
}

export default nextConfig
