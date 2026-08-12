const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable Watchman and use Node crawler
config.watcher = {
  useWatchman: false,
  healthCheck: {
    enabled: true,
  },
};

// Ignore deep .pnpm internal symlink paths so Metro doesn't loop forever
config.resolver.blockList = [
  /node_modules\/\.pnpm\/.*\/node_modules\/.*\/node_modules/,
  /\.git\/.*/,
];

module.exports = config;