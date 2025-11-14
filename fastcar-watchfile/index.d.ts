declare class WatchFile {
	constructor({ pollInterval, notifyTime }: { pollInterval: number; notifyTime: number });

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
	}): void;

	getFsCount(): number;
}

/**
 *
 * @params pollInterval 检测时间
 * @params notifyTime  延迟通知时间
 */
export function Watch(config: { pollInterval: number; notifyTime: number }): WatchFile;

/**
 * @version 1.0 单例模式
 *
 */
export function WatchSingleton(config: { pollInterval: number; notifyTime: number }): WatchFile;
