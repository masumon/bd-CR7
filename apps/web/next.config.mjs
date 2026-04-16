import withPWA from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache.js";

const CACHE_VERSION = "bdcr7-v2026-04-16";

const runtimeCaching = defaultRuntimeCaching
  .filter((entry) => entry?.options?.cacheName !== "apis")
  .map((entry) => ({
    ...entry,
    options: entry.options?.cacheName
      ? {
          ...entry.options,
          cacheName: `${CACHE_VERSION}-${entry.options.cacheName}`,
        }
      : entry.options,
  }));

runtimeCaching.push({
  urlPattern: ({ url }) => self.origin === url.origin && url.pathname.startsWith("/api/"),
  handler: "NetworkOnly",
  method: "GET",
});

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs inline scripts for hydration; nonce-based CSP is ideal but requires
      // middleware — using unsafe-inline for scripts is acceptable for this PWA today.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://bd-cr7.vercel.app https://api.cloudinary.com https://res.cloudinary.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.infrastructureLogging = {
      ...(config.infrastructureLogging || {}),
      level: "error",
    };
    return config;
  },
  transpilePackages: ["@bdcr7/media-engine", "@bdcr7/rbac-engine", "@bdcr7/ui-system", "@bdcr7/core-logic"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching,
});

export default pwaConfig(nextConfig);
