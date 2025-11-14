/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.vndb.org"
      },
      {
        protocol: "https",
        hostname: "t.vndb.org"
      },
      {
        protocol: "https",
        hostname: "beta.vndb.org"
      }
    ]
  }
};

module.exports = nextConfig;

