import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  },
  // Not under public/ on purpose — served only through the authenticated
  // /api/gradebook/deped-template route. Without this, Next's build tracing
  // isn't guaranteed to bundle a file outside public/ that's only read at
  // runtime via a dynamically-joined path.
  outputFileTracingIncludes: {
    "/api/gradebook/deped-template": ["./private-assets/templates/**/*"]
  }
};

export default nextConfig;
