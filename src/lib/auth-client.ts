import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
} = authClient;
