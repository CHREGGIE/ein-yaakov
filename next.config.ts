import type { NextConfig } from "next";

// The audio host (R2 behind audio.einyaakovshiur.com) is the only outside media source.
const audioOrigin = (() => {
  try {
    return process.env.AUDIO_BASE_URL ? new URL(process.env.AUDIO_BASE_URL).origin : "";
  } catch {
    return "";
  }
})();

// Content Security Policy, sent in report-only mode first: browsers log what it would block
// without blocking anything. Once a few weeks of normal use show no reports, switch the header
// name to Content-Security-Policy to enforce it. Next.js injects inline scripts for hydration,
// so script-src needs 'unsafe-inline' until we move to nonces.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `media-src 'self' blob: ${audioOrigin}`.trim(),
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Add "upgrade-insecure-requests" when switching to enforcing; browsers ignore it in report-only.
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  // Catalog files are read at build time; make sure they ship with server routes too.
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
