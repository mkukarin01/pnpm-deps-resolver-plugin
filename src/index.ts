import type { Plugin } from "esbuild";

import fs from "node:fs";
import path from "node:path";

interface ResolverConfig {
  packages?: string[];
  debug?: boolean;
  workspaceModulesPath?: string;
  rootModulesPath?: string;
  pnpmStorePath?: string;
}

const defaultConfig: Required<ResolverConfig> = {
  packages: [],
  debug: false,
  workspaceModulesPath: path.resolve(__dirname, "node_modules"),
  rootModulesPath: path.resolve(__dirname, "..", "..", "node_modules"),
  pnpmStorePath: path.resolve(__dirname, "..", "..", "node_modules", ".store"),
};

function pnpmDepsResolverPlugin(config: ResolverConfig): Plugin {
  const {
    packages,
    debug,
    workspaceModulesPath,
    rootModulesPath,
    pnpmStorePath,
  } = { ...defaultConfig, ...config };

  return {
    name: "pnpm-deps-resolver",
    setup(build) {
      build.onResolve({ filter: /^[^.]/ }, async (args) => {
        const importee = args.path;

        if (packages.length > 0 && !packages.includes(importee)) {
          return null;
        }

        if (debug) {
          console.log(
            `[pnpm-deps-resolver] Resolving ${importee} from ${args.importer}`
          );
        }

        const resolveDir = await resolvePackage(importee, [
          workspaceModulesPath,
          rootModulesPath,
          pnpmStorePath,
        ]);

        if (resolveDir) {
          if (debug) {
            console.log(
              `[pnpm-deps-resolver] Resolved ${importee} to ${resolveDir}`
            );
          }

          return { path: resolveDir };
        }

        if (debug) {
          console.warn(`[pnpm-deps-resolver] Unable to resolve ${importee}`);
        }

        return null;
      });
    },
  };
}

async function resolvePackage(
  importee: string,
  pathsToCheck: string[]
): Promise<string | null> {
  for (const basePath of pathsToCheck) {
    const candidatePath =
      basePath.includes(".store") || basePath.includes(".pnpm")
        ? resolveFromPnpmStore(importee, basePath)
        : path.join(basePath, importee);

    if (candidatePath && fs.existsSync(candidatePath)) {
      const entryFile = await resolvePackageEntry(candidatePath);

      if (entryFile) return entryFile;
    }
  }

  return null;
}

function resolveFromPnpmStore(
  importee: string,
  storePath: string
): string | null {
  if (!fs.existsSync(storePath)) return null;

  const packagePrefix = importee.replace("/", "-");
  const candidates = fs
    .readdirSync(storePath)
    .filter((dir) => dir.startsWith(`${packagePrefix}-npm-`));

  for (const candidate of candidates) {
    const candidatePath = path.join(
      storePath,
      candidate,
      "node_modules",
      importee
    );

    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function resolvePackageEntry(packageDir: string): Promise<string | null> {
  const pkgJsonPath = path.join(packageDir, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return null;

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const entryFields = ["module", "main", "exports"];

    for (const field of entryFields) {
      let entry = pkgJson[field];

      if (field === "exports" && entry) {
        if (typeof entry === "string") {
        } else if (entry.import) {
          entry = entry.import;
        } else if (entry["."].import) {
          entry = entry["."].import;
        } else {
          continue;
        }
      }

      if (entry) {
        const potentialPaths = [
          path.join(packageDir, entry),
          path.join(packageDir, `${entry}.js`),
          path.join(packageDir, `${entry}.mjs`),
          path.join(packageDir, entry, "index.js"),
        ];

        for (const p of potentialPaths) {
          if (fs.existsSync(p)) return p;
        }
      }
    }

    const fallbackIndex = path.join(packageDir, "index.js");

    if (fs.existsSync(fallbackIndex)) return fallbackIndex;
  } catch (error) {
    console.error(`[pnpm-deps-resolver] Error parsing package.json`, error);
    return null;
  }

  return null;
}

export default pnpmDepsResolverPlugin;
