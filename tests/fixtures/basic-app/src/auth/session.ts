export function createSession(email: string) {
  return {
    email,
    token: `session-${email}`
  };
}
