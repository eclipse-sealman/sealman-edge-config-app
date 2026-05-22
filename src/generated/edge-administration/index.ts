import { paths } from "./types";

export function getPath<T extends keyof paths>(path: T): T {
  return path;
}
