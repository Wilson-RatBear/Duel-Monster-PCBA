import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (url == null) {
	throw new Error("TURSO_DATABASE_URL is not set");
}

export default defineConfig({
	out: "./migrations",
	schema: "./src/lib/db/schemas/index.ts",
	dialect: "turso",
	dbCredentials: {
		url,
		authToken,
	},
});
