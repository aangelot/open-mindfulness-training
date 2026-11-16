const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Drizzle migrations (.sql) are imported by the app.
config.resolver.sourceExts.push('sql');

module.exports = config;
