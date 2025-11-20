import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
  srcDir: "src",
  manifest: () => {
    interface WxtEnv {
      WXT_GOOGLE_OAUTH_CLIENT_ID?: string;
    }
    const env = (import.meta as { env?: WxtEnv }).env ?? {};
    return {
      name: "VectoCart",
      description: "Collaborative shopping cart extension - share and collaborate on shopping carts across multiple e-commerce sites",
      // Extension key ensures consistent extension ID across all machines and builds
      // This is critical for OAuth redirect URIs and storage persistence
      key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8JINvPxexiq9oFJOdOq/10QrLf8lyCTkS64sdJdl5kiWIVKcc5+cx2VzhbvfeGYbskNUocKV4+K72T/j6h2R9mo5pm7hh1W+XahJD+Iksvnm28BbBfLmGWWwIjIwl3qW8pTYPaa6I+x8w9xM9W3ZGpv0WXHV4IEHSsZ7XYFJ4K5l28t+kPDJnIGJ0ju2GDWEk78M2MqFSQwCWOMiYsJHBkLpr7F/NhC9mnAhuBHB+skmyJiDclEHFXi7+UCBAKzDaCdNI2SDWYBfngAa646rh8zgrR6hiPPHSU2Lx8dSemKsJd3CAyGIvXwuyLxBn6mHiUjvRua3OItWJMei41m14wIDAQAB",
      icons: {
        16: "/icon/16.png",
        32: "/icon/32.png",
        48: "/icon/48.png",
        96: "/icon/96.png",
        128: "/icon/128.png",
      },
      permissions: ["identity", "sidePanel", "storage", "tabs"],
      host_permissions: [
        "*://*.amazon.in/*",
        "*://*.flipkart.com/*",
        "*://*.meesho.com/*",
      ],
      oauth2: {
        client_id: env.WXT_GOOGLE_OAUTH_CLIENT_ID,
        scopes: ["openid", "email", "profile"],
      },
    };
  },
});
