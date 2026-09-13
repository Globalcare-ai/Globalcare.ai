import type { NextConfig } from "next";

// A stray pnpm-lock.yaml sits in the home directory above this project, so Next
// inferred THAT as the workspace root — which also made Turbopack emit client
// manifest paths relative to the wrong root. next dev/build always run with the
// project directory as cwd, so this pins the root reliably no matter how Next
// loads/transpiles this config file.
const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
