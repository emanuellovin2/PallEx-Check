import type { NextConfig } from "next";
// @ts-expect-error next-pwa has no types
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: { cacheName: "next-static" },
    },
    {
      urlPattern: /^\/_next\/image\/.*/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "next-image" },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-data",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
};

export default pwaConfig(nextConfig);
