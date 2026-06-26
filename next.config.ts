import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.subcreation.app" }],
        destination: "https://subcreation.app/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/blob",
        search: "**",
      },
      {
        pathname: "/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
