/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El proyecto no incluye ESLint como dependencia; evita que el build se detenga por ello.
  eslint: { ignoreDuringBuilds: true },
  // bcryptjs se ejecuta solo en el servidor.
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
