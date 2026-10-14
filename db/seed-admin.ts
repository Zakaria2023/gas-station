/**
 * The first account, so somebody can sign in and add the others:
 * username "admin", password "admin". It must pick its own password at first
 * sign-in. Does nothing when an "admin" user already exists.
 *
 *   pnpm db:seed-admin
 */
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../src/lib/password";
import { db } from "./index";
import { Users } from "./schema";

const USERNAME = "admin";
const PASSWORD = "admin";

const main = async () => {
  const [existing] = await db.select({ id: Users.id }).from(Users).where(eq(Users.username, USERNAME));
  if (existing) {
    console.log(`"${USERNAME}" already exists; nothing changed.`);
    return;
  }
  await db.insert(Users).values({
    uuid: randomUUID(),
    username: USERNAME,
    name: "المدير",
    passwordHash: await hashPassword(PASSWORD),
    role: "admin",
    mustChangePassword: true,
  });
  console.log(`Added "${USERNAME}" (password "${PASSWORD}", to be changed at first sign-in).`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
