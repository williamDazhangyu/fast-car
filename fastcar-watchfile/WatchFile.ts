import * as fs from "fs";

/**
 * @version 1.0 采用轮询机制对文件的修改时间进行检测
 */
export default class WatchFile {
	private fsMap: Map<
		string,
		{
			time: number;
			context: {
				emit: (eventName: string | symbol, fp: string) => boolean;
			};
			eventName: string | symbol;
		}
	> = new Map(); //文件路径 - 检测时间

	private timerId: any;

	private pollInterval: number;

	private notifyTime: number;

	constructor({ pollInterval, notifyTime }: { pollInterval: number; notifyTime: number }) {
		this.pollInterval = pollInterval;
		this.notifyTime = notifyTime;

		this.loop();
	}

	addWatch({
		fp,
		context,
		eventName,
	}: {
		fp: string;
		context: {
			emit: (eventName: string | symbol, fp: string) => any;
		};
		eventName: string | symbol;
	}): void {
		if (this.fsMap.has(fp)) {
			return;
		}

		this.fsMap.set(fp, {
			time: Date.now(),
			context,
			eventName,
		});
	}

	getFsCount(): number {
		return this.fsMap.size;
	}

	loop() {
		const self = this;
		clearTimeout(self.timerId);

		let nowTime = Date.now();
		this.fsMap.forEach((item, fp) => {
			if (nowTime - item.time < this.notifyTime) {
				return;
			}

			if (fs.existsSync(fp)) {
				let fitem = fs.statSync(fp);
				if (fitem.isFile()) {
					let m = fitem.mtime.getTime();
					let diffTime = m - item.time;
					if (diffTime >= this.notifyTime) {
						item.context.emit(item.eventName, fp);
						item.time = m;
					}
				}
			}
		});

		self.timerId = setTimeout(async () => {
			self.loop();
		}, this.pollInterval);
	}
}
