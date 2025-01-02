import path = require("path");
import ReverseGenerate from "../src/util/ReverseGen";

ReverseGenerate.generator({
	tables: ["test"],
	modelDir: path.join(__dirname, "example", "model"),
	mapperDir: path.join(__dirname, "example", "mapper"),
	dbConfig: {
		host: "localhost",
		user: "postgres",
		password: "123456",
		port: 5432,
		database: "test",
	},
});
