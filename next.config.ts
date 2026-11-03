import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Catalog files are read at build time; make sure they ship with server routes too.
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
};

export default nextConfig;
