const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.alias = {
  "@": path.resolve(__dirname)  // Maps @ to the root directory
};

module.exports = defaultConfig;
