import ReverseGen from "../src/ReverseGen";
import * as path from "path";

//测试逆向生成
ReverseGen.generator(["test"], path.join(__dirname, "../", "test", "model"), path.join(__dirname, "../", "test", "mapper"), {
	database: "test",
	user: "root",
	password: "123456",
	host: "localhost",
});
