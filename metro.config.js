const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

config.resolver.alias = {
  '@react-native-community/netinfo': '@react-native-community/netinfo',
};

module.exports = withNativeWind(config, { input: './global.css' })