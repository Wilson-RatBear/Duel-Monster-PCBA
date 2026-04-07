import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (url == null) {
	throw new Error("TURSO_DATABASE_URL is not set");
}

const client = createClient({
	url,
	authToken,
});

export const db = drizzle({ client });
