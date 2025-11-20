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
      icons: {
        16: "/icon/16.png",
        32: "/icon/32.png",
        48: "/icon/48.png",
        96: "/icon/96.png",
        128: "/icon/128.png",
      },
      permissions: ["identity", "sidePanel", "storage", "tabs"],
      host_permissions: [
        "*://*.amazon.com/*",
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
