/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["node-vibrant"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.github.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  compiler: {
    styledJsx: false,
  },
}

module.exports = nextConfig
