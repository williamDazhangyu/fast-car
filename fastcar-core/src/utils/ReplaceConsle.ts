import Logger from "../interface/Logger";

const levels = ["log", "info", "warn", "error"];
//重构日志
export default function ReplaceConsle(logger: Logger, replaceConsole: boolean = false) {
	let beforeFn = levels.map(level => {
		return Reflect.get(console, level);
	});

	levels.forEach((level, index) => {
		Reflect.set(console, level, (...args: any[]) => {
			if (!replaceConsole) {
				Reflect.apply(beforeFn[index], beforeFn, args);
			}
			Reflect.apply(Reflect.get(logger, level), logger, args);
		});
	});
}
