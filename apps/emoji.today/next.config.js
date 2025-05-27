/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.github.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
}

module.exports = nextConfig
