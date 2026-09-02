import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "",
  },
  async redirects() {
    const legacyPlatforms = "instagram|tiktok|youtube|twitter|x";
    const legacyServices = "follower|followers|like|likes|view|views|comments";

    return [
      // Legacy platform + service + plans: /:platform/:service/plans -> /
      {
        source: `/:platform(${legacyPlatforms})/:service(${legacyServices})/plans`,
        destination: "/",
        permanent: true,
      },
      // Legacy platform + service: /:platform/:service -> /
      {
        source: `/:platform(${legacyPlatforms})/:service(${legacyServices})`,
        destination: "/",
        permanent: true,
      },
      // Legacy platform: /:platform -> /
      {
        source: `/:platform(${legacyPlatforms})`,
        destination: "/",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.tiktokcdn-us.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "**.byteoversea.com",
      },
      {
        protocol: "https",
        hostname: "**.ibytedtos.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.twimg.com",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
};

export default nextConfig;
