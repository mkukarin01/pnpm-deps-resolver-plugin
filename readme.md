# Esbuild - Pnpm-Deps-Resolver-Plugin

An Esbuild plugin designed primarily to resolve missing dependencies when using monorepo setups managed with pnpm or yarn-pnpm.
It helps ensure your Esbuild or Vite projects can correctly locate and bundle dependencies even when conventionally resolved packages are missing or stored in alternative locations (`.store`, root-level `node_modules`, or workspace-level `node_modules`).

## 🚀 Why use this plugin?

When working within monorepos or workspace setups managed by `pnpm`, you might encounter certain quirks, especially around dependency hoisting and linking, causing Esbuild or Vite builds to fail due to missing or improperly resolved dependencies.
This plugin assists by explicitly resolving these dependencies seamlessly during the build process.

## 📦 Installation

```bash
npm install --save-dev pnpm-deps-resolver-plugin
# OR
pnpm add -D pnpm-deps-resolver-plugin
```

## ⚙️ Usage

### With Esbuild:

```js
import esbuild from "esbuild";
import pnpmDepsResolverPlugin from "pnpm-deps-resolver-plugin";
esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  plugins: [
    pnpmDepsResolverPlugin({
      packages: ["some-missing-package", "another-package"],
      debug: true,
    }),
  ],
  outdir: "dist",
});
```

### With Vite (through `vite.config.ts`):

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pnpmDepsResolverPlugin from "./plugins/pnpm-deps-resolver";
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        pnpmDepsResolverPlugin({
          packages: ["some-missing-package", "another-package"],
          debug: true,
        }),
      ],
    }
  }
});
```

---

## 🔧 Configuration

| Option                 | Description                                                                   | Required | Default                               |
| ---------------------- | ----------------------------------------------------------------------------- | -------- | ------------------------------------- |
| `packages`             | A list of specific package names to resolve. If empty, resolves all packages. | No       | `[]`                                  |
| `debug`                | Enables detailed logging output for troubleshooting.                          | No       | `false`                               |
| `workspaceModulesPath` | Path to your workspace-level `node_modules` folder.                           | No       | `<plugin_location>/node_modules`      |
| `rootModulesPath`      | Path to your monorepo root-level `node_modules` directory.                    | No       | `<monorepo_root>/node_modules`        |
| `pnpmStorePath`        | Path to your pnpm store directory (`.store`).                                 | No       | `<monorepo_root>/node_modules/.store` |

---

## ⚠️ Important Notes

- This plugin specifically aims to remedy issues related to dependency resolution for Esbuild/Vite within `pnpm/yarn-pnpm` environments. It may be unnecessary (but harmless) in other environments.
- Always try the default `pnpm` workspace best practices and standard dependency management configuration before using this plugin to solve dependency resolution issues.

---

## 📜 License

Unlicensed yet.
