import { login } from "../src/auth/login";

test("login creates a session", () => {
  expect(login("user@example.com", "secret").email).toBe("user@example.com");
});
