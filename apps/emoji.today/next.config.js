/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["node-vibrant", "@emoji.today/emoji-assets"],
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

export default nextConfig
