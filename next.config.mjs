/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The ad images read their fonts and photos from disk: ship them with the route.
  outputFileTracingIncludes: {
    '/api/creative/*': ['./assets/fonts/*.ttf', './public/campaigns/*.jpg'],
  },
  images: {
    // Producer headshots come from the public `avatars` bucket in REVOL Team's
    // Supabase project.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
};
export default nextConfig;
