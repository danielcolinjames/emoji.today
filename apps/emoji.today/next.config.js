/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "node-vibrant",
    "@emoji.today/emoji-assets",
    "geist",
    // ESM packages that need transpilation in Next.js
    "@walletconnect/ethereum-provider",
    "@walletconnect/utils",
    "@walletconnect/jsonrpc-provider",
    "@walletconnect/jsonrpc-utils",
    "@walletconnect/safe-json",
    "wagmi",
    "@wagmi/core",
    "viem",
    "@coinbase/onchainkit",
    "@farcaster/miniapp-sdk",
  ],
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
