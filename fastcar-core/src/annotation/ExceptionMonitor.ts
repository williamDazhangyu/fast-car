import * as process from "process";

//异常监听器
export default function ExceptionMonitor(target: any) {
	process.on("uncaughtException", (err: any, origin: any) => {
		console.error(`Caught exception: ${err.message}`);
		console.error(`Exception origin: ${origin}`);
		console.error(`stack: ${err.stack}`);
	});

	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection at:", promise);
		console.error("reason:", reason);
	});
}
