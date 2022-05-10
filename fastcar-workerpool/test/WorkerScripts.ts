const { parentPort } = require("worker_threads");

function factorial(num: number): number {
	if (num <= 2) {
		return num;
	}

	return num * factorial(num - 1);
}

parentPort.on("message", ({ args }: any) => {
	let num = factorial(args[0]);
	parentPort.postMessage({
		err: null,
		res: num,
	});
});
