import WorkerPool from "../src/WorkerPool";

const total = 10000;

//求阶乘的方法
function factorial(num: number): number {
	if (num <= 2) {
		return num;
	}

	return num * factorial(num - 1);
}

let scripts = require.resolve("./WorkerScripts");

describe("工作线程池-阶乘测试", () => {
	it("多线程耗时动态传递函数测试", () => {
		let workerPool = new WorkerPool();
		let finshed = 0;
		let startTime = Date.now();
		for (let i = 0; i < total; i++) {
			workerPool.runTask({
				task: factorial,
				args: [i],
				cb: (err: Error, res: number) => {
					finshed++;
					if (finshed == total) {
						console.log("任务完成耗时：", Date.now() - startTime);
						queueMicrotask(() => {
							workerPool.close();
						});
					}
				},
			});
		}
	});
	it("多线程自定义脚本测试", () => {
		let workerPool = new WorkerPool({
			numThreads: 4,
			scripts,
		});
		let finshed = 0;
		let startTime = Date.now();
		for (let i = 0; i < total; i++) {
			workerPool.runTask({
				args: [i],
				cb: (err: Error, res: number) => {
					finshed++;
					if (finshed == total) {
						console.log("任务完成耗时：", Date.now() - startTime);
						queueMicrotask(() => {
							workerPool.close();
						});
					}
				},
			});
		}
	});
});
