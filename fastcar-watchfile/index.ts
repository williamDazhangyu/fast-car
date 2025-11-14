import WatchFile from "./WatchFile";

const SingletonWatchSingle: WatchFile | null = null;

export function Watch(config: { pollInterval: number; notifyTime: number }): WatchFile {
	return new WatchFile(config);
}

//单例模式
export function WatchSingleton(config: { pollInterval: number; notifyTime: number }): WatchFile {
	return SingletonWatchSingle || new WatchFile(config);
}
