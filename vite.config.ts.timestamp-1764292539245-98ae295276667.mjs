// vite.config.ts
import fs from "node:fs";
import { defineConfig } from "file:///D:/Users/30447/WebstormProjects/electron-vite-vue/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/Users/30447/WebstormProjects/electron-vite-vue/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import electron from "file:///D:/Users/30447/WebstormProjects/electron-vite-vue/node_modules/vite-plugin-electron/dist/simple.mjs";

// package.json
var package_default = {
  name: "majiang-live-tool",
  version: "1.0.0",
  main: "dist-electron/main/index.js",
  description: "\u9EBB\u5C06\u6BD4\u8D5B\u76F4\u64AD\u8F85\u52A9\u5DE5\u5177 - \u57FA\u4E8E Electron + Vue + Vite \u5F00\u53D1",
  author: "\u6BD4\u5C14 <your-email@example.com>",
  license: "MIT",
  private: true,
  keywords: [
    "electron",
    "vue3",
    "vite",
    "typescript",
    "majiang",
    "live-streaming",
    "overlay",
    "desktop-app"
  ],
  debug: {
    env: {
      VITE_DEV_SERVER_URL: "http://127.0.0.1:3344/"
    }
  },
  type: "module",
  scripts: {
    dev: "vite",
    build: "vue-tsc --noEmit && vite build && electron-builder",
    "build:win": "vue-tsc --noEmit && vite build && electron-builder --win",
    "build:mac": "vue-tsc --noEmit && vite build && electron-builder --mac",
    "build:linux": "vue-tsc --noEmit && vite build && electron-builder --linux",
    preview: "vite preview"
  },
  devDependencies: {
    "@vitejs/plugin-vue": "^5.0.4",
    electron: "^29.1.1",
    "electron-builder": "^24.13.3",
    typescript: "^5.4.2",
    vite: "^5.1.5",
    "vite-plugin-electron": "^0.28.4",
    "vite-plugin-electron-renderer": "^0.14.5",
    vue: "^3.4.21",
    "vue-tsc": "^2.0.6"
  },
  dependencies: {
    "vue-router": "^4.3.0"
  }
};

// vite.config.ts
var vite_config_default = defineConfig(({ command }) => {
  fs.rmSync("dist-electron", { recursive: true, force: true });
  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;
  return {
    plugins: [
      vue(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: "electron/main/index.ts",
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */
                "[startup] Electron App"
              );
            } else {
              startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons, 
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys("dependencies" in package_default ? package_default.dependencies : {})
              }
            }
          }
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: "electron/preload/index.ts",
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : void 0,
              // #332
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys("dependencies" in package_default ? package_default.dependencies : {})
              }
            }
          }
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {}
      })
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(package_default.debug.env.VITE_DEV_SERVER_URL);
      return {
        host: url.hostname,
        port: +url.port
      };
    })(),
    clearScreen: false
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcVXNlcnNcXFxcMzA0NDdcXFxcV2Vic3Rvcm1Qcm9qZWN0c1xcXFxlbGVjdHJvbi12aXRlLXZ1ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcVXNlcnNcXFxcMzA0NDdcXFxcV2Vic3Rvcm1Qcm9qZWN0c1xcXFxlbGVjdHJvbi12aXRlLXZ1ZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovVXNlcnMvMzA0NDcvV2Vic3Rvcm1Qcm9qZWN0cy9lbGVjdHJvbi12aXRlLXZ1ZS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCBmcyBmcm9tICdub2RlOmZzJ1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IGVsZWN0cm9uIGZyb20gJ3ZpdGUtcGx1Z2luLWVsZWN0cm9uL3NpbXBsZSdcclxuaW1wb3J0IHBrZyBmcm9tICcuL3BhY2thZ2UuanNvbidcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kIH0pID0+IHtcclxuICBmcy5ybVN5bmMoJ2Rpc3QtZWxlY3Ryb24nLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSlcclxuXHJcbiAgY29uc3QgaXNTZXJ2ZSA9IGNvbW1hbmQgPT09ICdzZXJ2ZSdcclxuICBjb25zdCBpc0J1aWxkID0gY29tbWFuZCA9PT0gJ2J1aWxkJ1xyXG4gIGNvbnN0IHNvdXJjZW1hcCA9IGlzU2VydmUgfHwgISFwcm9jZXNzLmVudi5WU0NPREVfREVCVUdcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgdnVlKCksXHJcbiAgICAgIGVsZWN0cm9uKHtcclxuICAgICAgICBtYWluOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQubGliLmVudHJ5YFxyXG4gICAgICAgICAgZW50cnk6ICdlbGVjdHJvbi9tYWluL2luZGV4LnRzJyxcclxuICAgICAgICAgIG9uc3RhcnQoeyBzdGFydHVwIH0pIHtcclxuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52LlZTQ09ERV9ERUJVRykge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKC8qIEZvciBgLnZzY29kZS8uZGVidWcuc2NyaXB0Lm1qc2AgKi8nW3N0YXJ0dXBdIEVsZWN0cm9uIEFwcCcpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc3RhcnR1cCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB2aXRlOiB7XHJcbiAgICAgICAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgICAgICAgc291cmNlbWFwLFxyXG4gICAgICAgICAgICAgIG1pbmlmeTogaXNCdWlsZCxcclxuICAgICAgICAgICAgICBvdXREaXI6ICdkaXN0LWVsZWN0cm9uL21haW4nLFxyXG4gICAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIC8vIFNvbWUgdGhpcmQtcGFydHkgTm9kZS5qcyBsaWJyYXJpZXMgbWF5IG5vdCBiZSBidWlsdCBjb3JyZWN0bHkgYnkgVml0ZSwgZXNwZWNpYWxseSBgQy9DKytgIGFkZG9ucywgXHJcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gdXNlIGBleHRlcm5hbGAgdG8gZXhjbHVkZSB0aGVtIHRvIGVuc3VyZSB0aGV5IHdvcmsgY29ycmVjdGx5LlxyXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJzIG5lZWQgdG8gcHV0IHRoZW0gaW4gYGRlcGVuZGVuY2llc2AgdG8gZW5zdXJlIHRoZXkgYXJlIGNvbGxlY3RlZCBpbnRvIGBhcHAuYXNhcmAgYWZ0ZXIgdGhlIGFwcCBpcyBidWlsdC5cclxuICAgICAgICAgICAgICAgIC8vIE9mIGNvdXJzZSwgdGhpcyBpcyBub3QgYWJzb2x1dGUsIGp1c3QgdGhpcyB3YXkgaXMgcmVsYXRpdmVseSBzaW1wbGUuIDopXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbDogT2JqZWN0LmtleXMoJ2RlcGVuZGVuY2llcycgaW4gcGtnID8gcGtnLmRlcGVuZGVuY2llcyA6IHt9KSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByZWxvYWQ6IHtcclxuICAgICAgICAgIC8vIFNob3J0Y3V0IG9mIGBidWlsZC5yb2xsdXBPcHRpb25zLmlucHV0YC5cclxuICAgICAgICAgIC8vIFByZWxvYWQgc2NyaXB0cyBtYXkgY29udGFpbiBXZWIgYXNzZXRzLCBzbyB1c2UgdGhlIGBidWlsZC5yb2xsdXBPcHRpb25zLmlucHV0YCBpbnN0ZWFkIGBidWlsZC5saWIuZW50cnlgLlxyXG4gICAgICAgICAgaW5wdXQ6ICdlbGVjdHJvbi9wcmVsb2FkL2luZGV4LnRzJyxcclxuICAgICAgICAgIHZpdGU6IHtcclxuICAgICAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgICAgICBzb3VyY2VtYXA6IHNvdXJjZW1hcCA/ICdpbmxpbmUnIDogdW5kZWZpbmVkLCAvLyAjMzMyXHJcbiAgICAgICAgICAgICAgbWluaWZ5OiBpc0J1aWxkLFxyXG4gICAgICAgICAgICAgIG91dERpcjogJ2Rpc3QtZWxlY3Ryb24vcHJlbG9hZCcsXHJcbiAgICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWw6IE9iamVjdC5rZXlzKCdkZXBlbmRlbmNpZXMnIGluIHBrZyA/IHBrZy5kZXBlbmRlbmNpZXMgOiB7fSksXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBQbG95ZmlsbCB0aGUgRWxlY3Ryb24gYW5kIE5vZGUuanMgQVBJIGZvciBSZW5kZXJlciBwcm9jZXNzLlxyXG4gICAgICAgIC8vIElmIHlvdSB3YW50IHVzZSBOb2RlLmpzIGluIFJlbmRlcmVyIHByb2Nlc3MsIHRoZSBgbm9kZUludGVncmF0aW9uYCBuZWVkcyB0byBiZSBlbmFibGVkIGluIHRoZSBNYWluIHByb2Nlc3MuXHJcbiAgICAgICAgLy8gU2VlIFx1RDgzRFx1REM0OSBodHRwczovL2dpdGh1Yi5jb20vZWxlY3Ryb24tdml0ZS92aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlclxyXG4gICAgICAgIHJlbmRlcmVyOiB7fSxcclxuICAgICAgfSksXHJcbiAgICBdLFxyXG4gICAgc2VydmVyOiBwcm9jZXNzLmVudi5WU0NPREVfREVCVUcgJiYgKCgpID0+IHtcclxuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChwa2cuZGVidWcuZW52LlZJVEVfREVWX1NFUlZFUl9VUkwpXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaG9zdDogdXJsLmhvc3RuYW1lLFxyXG4gICAgICAgIHBvcnQ6ICt1cmwucG9ydCxcclxuICAgICAgfVxyXG4gICAgfSkoKSxcclxuICAgIGNsZWFyU2NyZWVuOiBmYWxzZSxcclxuICB9XHJcbn0pXHJcbiIsICJ7XHJcbiAgXCJuYW1lXCI6IFwibWFqaWFuZy1saXZlLXRvb2xcIixcclxuICBcInZlcnNpb25cIjogXCIxLjAuMFwiLFxyXG4gIFwibWFpblwiOiBcImRpc3QtZWxlY3Ryb24vbWFpbi9pbmRleC5qc1wiLFxyXG4gIFwiZGVzY3JpcHRpb25cIjogXCJcdTlFQkJcdTVDMDZcdTZCRDRcdThENUJcdTc2RjRcdTY0QURcdThGODVcdTUyQTlcdTVERTVcdTUxNzcgLSBcdTU3RkFcdTRFOEUgRWxlY3Ryb24gKyBWdWUgKyBWaXRlIFx1NUYwMFx1NTNEMVwiLFxyXG4gIFwiYXV0aG9yXCI6IFwiXHU2QkQ0XHU1QzE0IDx5b3VyLWVtYWlsQGV4YW1wbGUuY29tPlwiLFxyXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxyXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxyXG4gIFwia2V5d29yZHNcIjogW1xyXG4gICAgXCJlbGVjdHJvblwiLFxyXG4gICAgXCJ2dWUzXCIsXHJcbiAgICBcInZpdGVcIixcclxuICAgIFwidHlwZXNjcmlwdFwiLFxyXG4gICAgXCJtYWppYW5nXCIsXHJcbiAgICBcImxpdmUtc3RyZWFtaW5nXCIsXHJcbiAgICBcIm92ZXJsYXlcIixcclxuICAgIFwiZGVza3RvcC1hcHBcIlxyXG4gIF0sXHJcbiAgXCJkZWJ1Z1wiOiB7XHJcbiAgICBcImVudlwiOiB7XHJcbiAgICAgIFwiVklURV9ERVZfU0VSVkVSX1VSTFwiOiBcImh0dHA6Ly8xMjcuMC4wLjE6MzM0NC9cIlxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXHJcbiAgXCJzY3JpcHRzXCI6IHtcclxuICAgIFwiZGV2XCI6IFwidml0ZVwiLFxyXG4gICAgXCJidWlsZFwiOiBcInZ1ZS10c2MgLS1ub0VtaXQgJiYgdml0ZSBidWlsZCAmJiBlbGVjdHJvbi1idWlsZGVyXCIsXHJcbiAgICBcImJ1aWxkOndpblwiOiBcInZ1ZS10c2MgLS1ub0VtaXQgJiYgdml0ZSBidWlsZCAmJiBlbGVjdHJvbi1idWlsZGVyIC0td2luXCIsXHJcbiAgICBcImJ1aWxkOm1hY1wiOiBcInZ1ZS10c2MgLS1ub0VtaXQgJiYgdml0ZSBidWlsZCAmJiBlbGVjdHJvbi1idWlsZGVyIC0tbWFjXCIsXHJcbiAgICBcImJ1aWxkOmxpbnV4XCI6IFwidnVlLXRzYyAtLW5vRW1pdCAmJiB2aXRlIGJ1aWxkICYmIGVsZWN0cm9uLWJ1aWxkZXIgLS1saW51eFwiLFxyXG4gICAgXCJwcmV2aWV3XCI6IFwidml0ZSBwcmV2aWV3XCJcclxuICB9LFxyXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI6IFwiXjUuMC40XCIsXHJcbiAgICBcImVsZWN0cm9uXCI6IFwiXjI5LjEuMVwiLFxyXG4gICAgXCJlbGVjdHJvbi1idWlsZGVyXCI6IFwiXjI0LjEzLjNcIixcclxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjQuMlwiLFxyXG4gICAgXCJ2aXRlXCI6IFwiXjUuMS41XCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLWVsZWN0cm9uXCI6IFwiXjAuMjguNFwiLFxyXG4gICAgXCJ2aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlclwiOiBcIl4wLjE0LjVcIixcclxuICAgIFwidnVlXCI6IFwiXjMuNC4yMVwiLFxyXG4gICAgXCJ2dWUtdHNjXCI6IFwiXjIuMC42XCJcclxuICB9LFxyXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwidnVlLXJvdXRlclwiOiBcIl40LjMuMFwiXHJcbiAgfVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1UsT0FBTyxRQUFRO0FBQzlWLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGNBQWM7OztBQ0hyQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsTUFBUTtBQUFBLEVBQ1IsYUFBZTtBQUFBLEVBQ2YsUUFBVTtBQUFBLEVBQ1YsU0FBVztBQUFBLEVBQ1gsU0FBVztBQUFBLEVBQ1gsVUFBWTtBQUFBLElBQ1Y7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBUztBQUFBLElBQ1AsS0FBTztBQUFBLE1BQ0wscUJBQXVCO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsSUFDVCxLQUFPO0FBQUEsSUFDUCxPQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixhQUFhO0FBQUEsSUFDYixlQUFlO0FBQUEsSUFDZixTQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakIsc0JBQXNCO0FBQUEsSUFDdEIsVUFBWTtBQUFBLElBQ1osb0JBQW9CO0FBQUEsSUFDcEIsWUFBYztBQUFBLElBQ2QsTUFBUTtBQUFBLElBQ1Isd0JBQXdCO0FBQUEsSUFDeEIsaUNBQWlDO0FBQUEsSUFDakMsS0FBTztBQUFBLElBQ1AsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxjQUFjO0FBQUEsRUFDaEI7QUFDRjs7O0FEdkNBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQzNDLEtBQUcsT0FBTyxpQkFBaUIsRUFBRSxXQUFXLE1BQU0sT0FBTyxLQUFLLENBQUM7QUFFM0QsUUFBTSxVQUFVLFlBQVk7QUFDNUIsUUFBTSxVQUFVLFlBQVk7QUFDNUIsUUFBTSxZQUFZLFdBQVcsQ0FBQyxDQUFDLFFBQVEsSUFBSTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxJQUFJO0FBQUEsTUFDSixTQUFTO0FBQUEsUUFDUCxNQUFNO0FBQUE7QUFBQSxVQUVKLE9BQU87QUFBQSxVQUNQLFFBQVEsRUFBRSxRQUFRLEdBQUc7QUFDbkIsZ0JBQUksUUFBUSxJQUFJLGNBQWM7QUFDNUIsc0JBQVE7QUFBQTtBQUFBLGdCQUF5QztBQUFBLGNBQXdCO0FBQUEsWUFDM0UsT0FBTztBQUNMLHNCQUFRO0FBQUEsWUFDVjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLE1BQU07QUFBQSxZQUNKLE9BQU87QUFBQSxjQUNMO0FBQUEsY0FDQSxRQUFRO0FBQUEsY0FDUixRQUFRO0FBQUEsY0FDUixlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxnQkFLYixVQUFVLE9BQU8sS0FBSyxrQkFBa0Isa0JBQU0sZ0JBQUksZUFBZSxDQUFDLENBQUM7QUFBQSxjQUNyRTtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsU0FBUztBQUFBO0FBQUE7QUFBQSxVQUdQLE9BQU87QUFBQSxVQUNQLE1BQU07QUFBQSxZQUNKLE9BQU87QUFBQSxjQUNMLFdBQVcsWUFBWSxXQUFXO0FBQUE7QUFBQSxjQUNsQyxRQUFRO0FBQUEsY0FDUixRQUFRO0FBQUEsY0FDUixlQUFlO0FBQUEsZ0JBQ2IsVUFBVSxPQUFPLEtBQUssa0JBQWtCLGtCQUFNLGdCQUFJLGVBQWUsQ0FBQyxDQUFDO0FBQUEsY0FDckU7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUlBLFVBQVUsQ0FBQztBQUFBLE1BQ2IsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLFFBQVEsUUFBUSxJQUFJLGlCQUFpQixNQUFNO0FBQ3pDLFlBQU0sTUFBTSxJQUFJLElBQUksZ0JBQUksTUFBTSxJQUFJLG1CQUFtQjtBQUNyRCxhQUFPO0FBQUEsUUFDTCxNQUFNLElBQUk7QUFBQSxRQUNWLE1BQU0sQ0FBQyxJQUFJO0FBQUEsTUFDYjtBQUFBLElBQ0YsR0FBRztBQUFBLElBQ0gsYUFBYTtBQUFBLEVBQ2Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
