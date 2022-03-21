export default abstract class Logger {
	abstract info(...args: any[]): void;

	abstract debug(...args: any[]): void;

	abstract warn(...args: any[]): void;

	abstract error(...args: any[]): void;
}
