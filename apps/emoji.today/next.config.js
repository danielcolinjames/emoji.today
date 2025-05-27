/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.blackbird.xyz",
        port: "",
        pathname: "/**",
      },
    ],
  },
  publicRuntimeConfig: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  serverRuntimeConfig: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
