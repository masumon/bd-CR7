/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bdcr7/media-engine", "@bdcr7/rbac-engine", "@bdcr7/ui-system", "@bdcr7/core-logic"],
};

export default nextConfig;
