import { MysqlService } from "../../src/MysqlService";

let service = new MysqlService([
	{
		source: "read",
		host: "localhost",
		port: 3306,
		database: "cosmopolis",
		user: "root",
		password: "123456",
		maxConnection: 10,
	},
	{
		source: "write",
		host: "localhost",
		port: 3306,
		database: "cosmopolis",
		user: "root",
		password: "123456",
		maxConnection: 10,
	},
]);

setTimeout(async () => {
	let res = await service.selectOne("mail_box");
	console.log(res);
}, 1000);
