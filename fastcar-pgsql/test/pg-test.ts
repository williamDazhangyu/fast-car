import { Pool } from "pg";

const pool = new Pool({
	host: "localhost",
	user: "postgres",
	password: "123456",
	port: 5432,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
	database: "test",
});

async function test() {
	const result = await pool.query("SELECT * from test limit $1 offset $2", [1, 0]);
	console.log(JSON.stringify(result.rows), result.rowCount);

	pool.connect();
}

test();
