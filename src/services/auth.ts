import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { createSession, deleteSession, UserSummary, userForToken } from "./users";

/**
 * Who is signed in, from the session cookie. Every page, Server Action and
 * route checks through here: the proxy only turns away browsers with no
 * cookie at all, it never looks at the database.
 */

export type CurrentUser = UserSummary;

const cookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires,
});

export const sessionToken = async (): Promise<string | null> =>
  (await cookies()).get(SESSION_COOKIE)?.value ?? null;

/** The signed-in user, asked once per request however many callers ask. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await sessionToken();
  return token ? userForToken(token) : null;
});

/** For a page or action that needs only a session, even one that must still change its password. */
export const requireSignedIn = async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
};

/** For every page and action of the app: signed in, with a password of their own. */
export const requireUser = async (): Promise<CurrentUser> => {
  const user = await requireSignedIn();
  if (user.mustChangePassword) {
    redirect("/account/password");
  }
  return user;
};

/** For managing users. */
export const requireAdmin = async (): Promise<CurrentUser> => {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
};

/** Sign a user in on this browser: a new session and its cookie. Only from a Server Action. */
export const startSession = async (userId: number): Promise<void> => {
  const { token, expiresAt } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
};

/** Sign this browser out. Only from a Server Action. */
export const endSession = async (): Promise<void> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(token);
  }
  store.delete(SESSION_COOKIE);
};
