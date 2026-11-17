const http = require('node:http');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Drizzle migrations (.sql) are imported by the app.
config.resolver.sourceExts.push('sql');

// expo-sqlite on web: wa-sqlite is a .wasm asset and needs SharedArrayBuffer, which
// browsers only enable on a cross-origin isolated page (COOP + COEP headers).
config.resolver.assetExts.push('wasm');

// The Expo docs set these headers in `server.enhanceMiddleware`, but Expo CLI serves the
// web page itself, before Metro's middleware, so the page never got them. Setting them on
// every response of the dev server covers the page too. A production web host must send
// the same two headers.
const writeHead = http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype.writeHead = function (...args) {
  if (!this.headersSent) {
    this.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    this.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }
  return writeHead.apply(this, args);
};

module.exports = config;
