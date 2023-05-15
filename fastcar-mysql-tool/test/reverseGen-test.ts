import ReverseGen from "../src/ReverseGen";
import * as path from "path";

//测试逆向生成
ReverseGen.generator({
	tables: ["test"],
	modelDir: path.join(__dirname, "../", "test", "model"),
	mapperDir: path.join(__dirname, "../", "test", "mapper"),
	dbConfig: {
		database: "test",
		user: "root",
		password: "123456",
		host: "localhost",
	},
	ignoreCamelcase: true,
	style: {
		tabWidth: 4,
		printWidth: 200,
		trailingComma: "es5",
		useTabs: true,
		parser: "typescript",
		endOfLine: "crlf", //文件结束符
	},
});
