/** @type {import('next').NextConfig} */
const nextConfig = {
  // packages/shared is a workspace TS package compiled by Next.
  transpilePackages: ["@lockin/shared"],
};

export default nextConfig;
