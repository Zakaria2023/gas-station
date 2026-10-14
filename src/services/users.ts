import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, eq, gt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { UserRole } from "@/db/enum";
import { Sessions, SelectUsers, Users } from "@/db/schema";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/password";
import { generateUuid, isUniqueViolation } from "@/utils";

/** A browser stays signed in this long after it was last used. */
export const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

export type UserSummary = Pick<
  SelectUsers,
  "id" | "uuid" | "username" | "name" | "role" | "active" | "mustChangePassword"
>;

const summary = {
  id: Users.id,
  uuid: Users.uuid,
  username: Users.username,
  name: Users.name,
  role: Users.role,
  active: Users.active,
  mustChangePassword: Users.mustChangePassword,
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const DUPLICATE_USERNAME = "اسم المستخدم مأخوذ. اختر اسماً ثانياً.";
const LAST_ADMIN = "لازم يضل مدير واحد على الأقل فعّال.";

// ── Signing in ────────────────────────────────────────────────────────────

/**
 * Check a username and password. Five wrong passwords in a row lock the
 * account for five minutes; an unknown name costs the same time as a wrong
 * password and gets the same answer.
 */
export const authenticate = async (username: string, password: string): Promise<UserSummary> => {
  const [user] = await db
    .select({
      ...summary,
      passwordHash: Users.passwordHash,
      failedAttempts: Users.failedAttempts,
      lockedUntil: Users.lockedUntil,
    })
    .from(Users)
    .where(eq(Users.username, username.trim().toLowerCase()));
  const wrong = new Error("اسم المستخدم أو كلمة السر غلط");

  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    throw wrong;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error(`كثير محاولات غلط. جرّب بعد ${LOCK_MINUTES} دقائق.`);
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    await db
      .update(Users)
      .set({
        failedAttempts: sql`case when ${Users.failedAttempts} + 1 >= ${MAX_ATTEMPTS} then 0 else ${Users.failedAttempts} + 1 end`,
        lockedUntil: sql`case when ${Users.failedAttempts} + 1 >= ${MAX_ATTEMPTS} then now() + make_interval(mins => ${LOCK_MINUTES}) else null end`,
      })
      .where(eq(Users.id, user.id));
    throw wrong;
  }
  if (!user.active) {
    throw new Error("هذا الحساب موقوف. راجع المدير.");
  }
  if (user.failedAttempts > 0 || user.lockedUntil) {
    await db.update(Users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(Users.id, user.id));
  }
  const { passwordHash: _hash, failedAttempts: _attempts, lockedUntil: _locked, ...found } = user;
  void [_hash, _attempts, _locked];
  return found;
};

/** Open a session for a user; the returned token goes in the cookie, its hash in the table. */
export const createSession = async (userId: number): Promise<{ token: string; expiresAt: Date }> => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await db.insert(Sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
};

/**
 * The user behind a cookie's token, or null when the session has ended or
 * the user was disabled. A session used again is pushed back to a full
 * thirty days, at most once a day so reads stay reads.
 */
export const userForToken = async (token: string): Promise<UserSummary | null> => {
  const [row] = await db
    .select({ ...summary, sessionId: Sessions.id, expiresAt: Sessions.expiresAt })
    .from(Sessions)
    .innerJoin(Users, eq(Sessions.userId, Users.id))
    .where(and(eq(Sessions.tokenHash, hashToken(token)), gt(Sessions.expiresAt, new Date())));
  if (!row || !row.active) {
    return null;
  }
  const { sessionId, expiresAt, ...user } = row;
  if (expiresAt.getTime() - Date.now() < (SESSION_DAYS - 1) * DAY_MS) {
    await db
      .update(Sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_DAYS * DAY_MS) })
      .where(eq(Sessions.id, sessionId));
  }
  return user;
};

export const deleteSession = async (token: string): Promise<void> => {
  await db.delete(Sessions).where(eq(Sessions.tokenHash, hashToken(token)));
};

/** Sign a user out everywhere, or everywhere but the browser making the change. */
export const deleteUserSessions = async (userId: number, keepToken?: string): Promise<void> => {
  await db
    .delete(Sessions)
    .where(
      and(eq(Sessions.userId, userId), keepToken ? ne(Sessions.tokenHash, hashToken(keepToken)) : undefined),
    );
};

/** A user changing their own password: the current one first, then every other browser signs out. */
export const changeOwnPassword = async (
  userId: number,
  current: string,
  next: string,
  keepToken: string,
): Promise<void> => {
  const [user] = await db.select({ passwordHash: Users.passwordHash }).from(Users).where(eq(Users.id, userId));
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    throw new Error("كلمة السر الحالية غلط");
  }
  await db
    .update(Users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
    .where(eq(Users.id, userId));
  await deleteUserSessions(userId, keepToken);
};

// ── Managing users (admins only; the actions check) ─────────────────────────

export const listUsers = (): Promise<UserSummary[]> =>
  db.select(summary).from(Users).orderBy(asc(Users.name));

export const getUser = async (uuid: string): Promise<UserSummary | null> => {
  const [user] = await db.select(summary).from(Users).where(eq(Users.uuid, uuid));
  return user ?? null;
};

export const createUser = async (fields: {
  name: string;
  username: string;
  password: string;
  role: UserRole;
}): Promise<string> => {
  const uuid = generateUuid();
  try {
    await db.insert(Users).values({
      uuid,
      name: fields.name,
      username: fields.username.trim().toLowerCase(),
      passwordHash: await hashPassword(fields.password),
      role: fields.role,
      // The admin chose this password; the new user picks their own.
      mustChangePassword: true,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(DUPLICATE_USERNAME);
    }
    throw error;
  }
  return uuid;
};

const activeAdmins = async (): Promise<number> => {
  const [row] = await db
    .select({ total: count() })
    .from(Users)
    .where(and(eq(Users.role, "admin"), eq(Users.active, true)));
  return Number(row?.total ?? 0);
};

/**
 * Change a user's name, role or whether they can sign in. The last active
 * admin cannot be demoted or disabled, and a disabled user is signed out.
 */
export const updateUser = async (
  uuid: string,
  fields: { name: string; role: UserRole; active: boolean },
  byUserId: number,
): Promise<void> => {
  const user = await getUser(uuid);
  if (!user) {
    throw new Error("هذا المستخدم غير موجود");
  }
  if (user.id === byUserId && !fields.active) {
    throw new Error("ما بتقدر توقف حسابك أنت");
  }
  const losesAdmin = user.role === "admin" && user.active && (fields.role !== "admin" || !fields.active);
  if (losesAdmin && (await activeAdmins()) <= 1) {
    throw new Error(LAST_ADMIN);
  }
  await db.update(Users).set(fields).where(eq(Users.id, user.id));
  if (!fields.active) {
    await deleteUserSessions(user.id);
  }
};

/** An admin sets a new password for someone: they are signed out and choose their own at next sign-in. */
export const resetUserPassword = async (uuid: string, password: string): Promise<void> => {
  const user = await getUser(uuid);
  if (!user) {
    throw new Error("هذا المستخدم غير موجود");
  }
  await db
    .update(Users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true, failedAttempts: 0, lockedUntil: null })
    .where(eq(Users.id, user.id));
  await deleteUserSessions(user.id);
};
