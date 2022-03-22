/***
 * @version 1.0 数据源管理器
 */
export default interface DataSourceManager {
	createSession(): string;

	destorySession(sessionId: string, status: boolean): Promise<void>;

	destorySession(sessionId: string, status: boolean): void;

	start(): void;

	stop(): void;
}
