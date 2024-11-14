/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/accounts/:path*",
        destination: "https://cardano-preprod.blockfrost.io/api/v0/accounts/:path*",
      },
      {
        source: "/blocks/:path*",
        destination: "https://cardano-preprod.blockfrost.io/api/v0/blocks/:path*",
      },
      {
        source: "/governance/:path*",
        destination: "https://cardano-preprod.blockfrost.io/api/v0/governance/:path*",
      },
    ];
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };
    return config;
  },
};

module.exports = nextConfig;
