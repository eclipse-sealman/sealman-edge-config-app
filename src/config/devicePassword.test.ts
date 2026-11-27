import { createServer } from "vite";
import importMetaEnv from "@import-meta-env/unplugin";
import { runInNewContext } from "node:vm";

let runtimeSource: string;

async function transformedFlag(mode: "runtime" | "compile-time") {
  const server = await createServer({
    configFile: false,
    envFile: false,
    mode: "production",
    plugins: [importMetaEnv.vite({ example: ".env.example", env: ".env.example", transformMode: mode })],
    server: { middlewareMode: true, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: "custom",
    logLevel: "silent",
  });
  try {
    const transformed = await server.transformRequest("/src/config/devicePassword.ts");
    if (!transformed) throw new Error("Vite did not transform the password flag.");
    return transformed.code.replace("export function", "function") + "; isDevicePasswordEnabled();";
  } finally {
    await server.close();
  }
}

beforeAll(async () => {
  runtimeSource = await transformedFlag("runtime");
});

afterEach(() => vi.unstubAllEnvs());

it.each(["false", "False", "FALSE", " false ", "\tFaLsE\n", false, undefined, null, "", " ", "enabled", "yes", "no", "1", "0", 1, 0, {}, ["true"]])("disables the real runtime-injected flag for %j", (value) => {
  expect(runtimeSource).toContain("globalThis.import_meta_env");
  expect(runInNewContext(runtimeSource, { import_meta_env: { VITE_DEVICE_PASSWORD_ENABLED: value } })).toBe(false);
});

it.each(["true", "True", "TRUE", " true ", "\tTrUe\n", true])("enables the real runtime-injected flag only for explicit true: %j", (value) => {
  expect(runInNewContext(runtimeSource, { import_meta_env: { VITE_DEVICE_PASSWORD_ENABLED: value } })).toBe(true);
});

it.each([
  ["False", false],
  ["True", true],
  ["", false],
  ["yes", false],
] as const)("normalizes %j through the real compile-time environment transform", async (value, enabled) => {
  vi.stubEnv("VITE_DEVICE_PASSWORD_ENABLED", value);
  const source = await transformedFlag("compile-time");
  expect(source).not.toContain("globalThis.import_meta_env");
  expect(runInNewContext(source)).toBe(enabled);
});
