import { authenticate } from "@ctxsift/auth";

export function route(path: string) {
  return authenticate(path) ? `/web${path}` : "/login";
}
