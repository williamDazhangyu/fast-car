import { parentPort, workerData } from "worker_threads";

if (parentPort) {
	const fnMap: Map<string, Function> = new Map();

	let firstScript: Function | null = null;

	if (workerData) {
		let { scripts } = workerData;
		if (Array.isArray(scripts)) {
			scripts.forEach((script) => {
				let fn = new Function("return " + script)();
				fnMap.set(script, fn);
				if (!firstScript) {
					firstScript = fn;
				}
			});
		}
	}

	parentPort.on("message", async ({ task, args }) => {
		try {
			let res = null;

			if (!task) {
				//默认取脚本中的第一个
				task = firstScript;
			}

			if (task) {
				let fn = fnMap.get(task);
				if (!fn) {
					fn = new Function("return " + task)();
					if (!fn) {
						throw new Error(`${task} is not a method`);
					}

					fnMap.set(task, fn);
					//判断如果超过了一万个缓存则将先塞进来的淘汰掉防止内存爆掉
					if (fnMap.size > 10000) {
						for (let [key] of fnMap) {
							fnMap.delete(key);
							break;
						}
					}
				}

				res = await Promise.resolve(Reflect.apply(fn, null, args));
				parentPort?.postMessage({
					err: null,
					res,
				});
			} else {
				parentPort?.postMessage({
					err: new Error(`Execution method not found`),
				});
			}
		} catch (err) {
			parentPort?.postMessage({
				err,
			});
		}
	});
}
