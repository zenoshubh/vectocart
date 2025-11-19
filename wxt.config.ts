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
    permissions: ["identity", "sidePanel", "storage"],
    oauth2: {
        client_id: env.WXT_GOOGLE_OAUTH_CLIENT_ID,
      scopes: ["openid", "email", "profile"],
    },
    };
  },
});
