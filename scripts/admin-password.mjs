// Sets the admin email and password in .env.local (hash only; the password is never stored).
// Usage: npm run admin:password
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });
const email = (await rl.question("Admin email: ")).trim().toLowerCase();
const password = await rl.question("New password (12+ characters): ");
rl.close();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("That email doesn't look right.");
if (password.length < 12) throw new Error("Use at least 12 characters.");

const hash = Buffer.from(await bcrypt.hash(password, 12)).toString("base64");
const file = ".env.local";
let env = existsSync(file) ? readFileSync(file, "utf8") : "";
const set = (key, value) => {
  const line = `${key}=${value}`;
  env = new RegExp(`^${key}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${key}=.*$`, "m"), line) : `${env.trimEnd()}\n${line}\n`;
};
set("ADMIN_EMAIL", email);
set("ADMIN_PASSWORD_HASH", hash);
if (!/^AUTH_SECRET=/m.test(env)) set("AUTH_SECRET", randomBytes(32).toString("base64"));
writeFileSync(file, env.trimStart());
console.log(`Saved to ${file}. Restart the server to sign in. On Vercel, copy ADMIN_EMAIL, ADMIN_PASSWORD_HASH and AUTH_SECRET into Project Settings → Environment Variables.`);
