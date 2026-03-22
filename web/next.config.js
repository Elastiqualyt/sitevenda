/** @type {import('next').NextConfig} */
const isWindows = process.platform === 'win32';

const nextConfig = {
  reactStrictMode: true,
  /**
   * Windows: reduz falhas ao observar ficheiros em `.next` (antivírus, locks, vários `node`).
   * Ajuda a evitar erros intermitentes ao servir chunks em desenvolvimento.
   * @see https://github.com/vercel/next.js/discussions/60185
   */
  webpack: (config, { dev }) => {
    if (dev && isWindows) {
      config.watchOptions = {
        poll: 1500,
        aggregateTimeout: 500,
      };
    }
    return config;
  },
  // API consumida pelo app React Native
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
