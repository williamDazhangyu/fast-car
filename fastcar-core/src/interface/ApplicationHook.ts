export default interface ApplicationHook {
	beforeStartServer(): Promise<void> | void; //启动前调用

	startServer(): Promise<void> | void; //启动时调用

	beforeStopServer(): Promise<void> | void; //停止前调用

	stopServer(): void; //停止后调用 方法为指定的同步方法
}
