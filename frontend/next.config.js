/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  transpilePackages: ['react-konva', 'konva'],
  webpack: (config, { isServer, webpack }) => {
    // Fix for canvas module in react-konva
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
        path: false,
        os: false,
        util: false,
        stream: false,
        assert: false,
        constants: false,
        crypto: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        zlib: false,
      };

      // Prevent Konva from loading Node.js version - use browser version instead
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        'konva/lib/index-node.js': 'konva/lib/index.js',
      };

      // Ignore canvas module when imported from konva
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
    }

    return config;
  },
}

module.exports = nextConfig

