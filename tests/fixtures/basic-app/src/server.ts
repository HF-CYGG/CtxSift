import { login } from "./auth/login";

export function handleLoginRequest(email: string, password: string) {
  return login(email, password);
}
