import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userRoles } from "../enum";

export const userRoleEnum = pgEnum("user_role", userRoles);

/**
 * Someone who signs in. The username is stored lower-case, so "Admin" and
 * "admin" are the same person. A user is disabled rather than deleted.
 */
export const Users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().unique(),
    username: varchar("username", { length: 40 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    // scrypt, with its parameters and salt in the string (src/lib/password.ts).
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("staff"),
    active: boolean("active").notNull().default(true),
    // Set for a password someone else chose: the user picks their own before anything else.
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    // Five wrong passwords in a row lock the account for a few minutes.
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("uq_users_username").on(table.username)],
);

/**
 * One signed-in browser. The cookie holds a random token; only its SHA-256
 * is stored, so a leaked table cannot be replayed as cookies.
 */
export const Sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => Users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uq_sessions_token").on(table.tokenHash), index("idx_sessions_user").on(table.userId)],
);

export type SelectUsers = InferSelectModel<typeof Users>;
export type InsertUsers = InferInsertModel<typeof Users>;
export type SelectSessions = InferSelectModel<typeof Sessions>;
