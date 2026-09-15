import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Raised from the 1MB default to allow video and PDF document uploads
      // in the admin post form. Individual file-type limits are enforced in
      // src/lib/actions/posts.ts.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
