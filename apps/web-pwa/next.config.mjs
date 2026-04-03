import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bdcr7/media-engine", "@bdcr7/rbac-engine", "@bdcr7/ui-system", "@bdcr7/core-logic"],
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
});

export default pwaConfig(nextConfig);
