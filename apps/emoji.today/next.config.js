/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["node-vibrant", "@emoji.today/emoji-assets", "geist"],
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
  // Move to root level as per Next.js warning
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/linux-x64",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // For server-side (API routes), exclude client-side wallet dependencies
      config.externals = config.externals || []
      config.externals.push("unfetch")

      // Handle the unfetch import issue with try-catch for dynamic imports
      config.resolve.alias = {
        ...config.resolve.alias,
        unfetch: false,
        "isomorphic-unfetch": "node-fetch",
      }
    } else {
      // For client-side, handle the unfetch resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        unfetch: "unfetch",
      }
    }

    // Handle ESM modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    return config
  },
}

export default nextConfig
