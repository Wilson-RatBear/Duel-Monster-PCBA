import cors from "cors";
import express from "express";
import "dotenv/config";
import { db } from "./lib/db/client";
import { usersTable } from "./lib/db/schemas";

const app = express();

const origin = ["https://web.localhost"];

app.use(
	cors({
		origin,
	}),
);

app.get("/", async (req, res) => {
	const users = await db.select().from(usersTable);

	res.json({
		data: {
			users,
		},
	});
});

const port = process.env.PORT ?? "3000";

app.listen(port, () => {
	console.log("Server is running on port 3000");
});
