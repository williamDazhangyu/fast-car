import WinstonLogger from "../../src/model/WinstonLogger";

let factoryLogger = new WinstonLogger({
	consoleLevel: "info",
	fileLevel: "info",
	rootPath: __dirname, //日志路径夹
	maxsize: 1024, //字节
	maxFiles: 5, //最大文件数
	printConsole: true,
});

let sys = factoryLogger.addLogger("sys");
sys.info({ hello: "world" });
sys.info("1", "2", "3");
sys.error(new Error("error ~"));
