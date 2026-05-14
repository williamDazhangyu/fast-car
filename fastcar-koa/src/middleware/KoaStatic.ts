import { FastCarApplication } from "@fastcar/core";
import { KoaConfig, KoaStaticItemConfig } from "../type/KoaConfig";
import * as fs from "fs";
import * as path from "path";
import * as Koa from "koa";

type StaticFile = {
	filePath: string;
	stat: fs.Stats;
};

type StaticOptions = {
	index?: string | false;
	fallback?: string;
};

function normalizeMountPath(mountPath: string) {
	if (!mountPath.startsWith("/")) {
		mountPath = `/${mountPath}`;
	}
	return mountPath.length > 1 ? mountPath.replace(/\/+$/, "") : mountPath;
}

function getRequestFilePath(mountPath: string, rootPath: string, requestPath: string) {
	if (mountPath != "/" && requestPath != mountPath && !requestPath.startsWith(`${mountPath}/`)) {
		return;
	}

	let relativePath = mountPath == "/" ? requestPath : requestPath.slice(mountPath.length) || "/";
	try {
		relativePath = decodeURIComponent(relativePath);
	} catch {
		return;
	}

	let filePath = path.resolve(rootPath, `.${relativePath}`);
	let relativeFilePath = path.relative(rootPath, filePath);
	if (relativeFilePath.startsWith("..") || path.isAbsolute(relativeFilePath)) {
		return;
	}

	return filePath;
}

function getStaticFile(filePath: string, options: StaticOptions = {}): StaticFile | undefined {
	let stat: fs.Stats;
	try {
		stat = fs.statSync(filePath);
	} catch {
		return;
	}

	if (stat.isDirectory()) {
		if (!options.index) {
			return;
		}
		filePath = path.join(filePath, options.index);
		try {
			stat = fs.statSync(filePath);
		} catch {
			return;
		}
	}

	return stat.isFile() ? { filePath, stat } : undefined;
}

function getFallbackFile(rootPath: string, options: StaticOptions) {
	if (!options.fallback) {
		return;
	}
	let filePath = getRequestFilePath("/", rootPath, options.fallback.startsWith("/") ? options.fallback : `/${options.fallback}`);
	return filePath ? getStaticFile(filePath) : undefined;
}

function parseRange(range: string, size: number) {
	let match = /^bytes=(\d*)-(\d*)$/.exec(range);
	if (!match) {
		return;
	}

	let start = match[1] ? Number(match[1]) : 0;
	let end = match[2] ? Number(match[2]) : size - 1;
	if (match[1] == "" && match[2]) {
		start = Math.max(size - Number(match[2]), 0);
		end = size - 1;
	}

	if (start > end || start >= size) {
		return false;
	}

	return { start, end: Math.min(end, size - 1) };
}

function setFileResponse(ctx: Koa.Context, file: StaticFile) {
	let range = ctx.get("Range");
	ctx.status = 200;
	ctx.type = path.extname(file.filePath);
	ctx.set("Accept-Ranges", "bytes");

	if (range) {
		let result = parseRange(range, file.stat.size);
		if (result === false) {
			ctx.status = 416;
			ctx.set("Content-Range", `bytes */${file.stat.size}`);
			return;
		}
		if (result) {
			ctx.status = 206;
			ctx.set("Content-Range", `bytes ${result.start}-${result.end}/${file.stat.size}`);
			ctx.length = result.end - result.start + 1;
			if (ctx.method != "HEAD") {
				ctx.body = fs.createReadStream(file.filePath, result);
			}
			return;
		}
	}

	ctx.length = file.stat.size;
	if (ctx.method != "HEAD") {
		ctx.body = fs.createReadStream(file.filePath);
	}
}

function createStaticMiddleware(mountPath: string, rootPath: string, options: StaticOptions = {}): Koa.Middleware {
	mountPath = normalizeMountPath(mountPath);
	rootPath = path.resolve(rootPath);

	return async (ctx, next) => {
		if (ctx.method != "GET" && ctx.method != "HEAD") {
			return next();
		}

		let filePath = getRequestFilePath(mountPath, rootPath, ctx.path);
		let file = filePath ? getStaticFile(filePath, options) : undefined;
		if (!file) {
			file = filePath ? getFallbackFile(rootPath, options) : undefined;
			if (!file) {
				return next();
			}
		}

		setFileResponse(ctx, file);
	};
}

function normalizeStaticConfig(config: KoaStaticItemConfig) {
	return typeof config == "string" ? { root: config, options: {} } : { root: config.path, options: { index: config.index, fallback: config.fallback } };
}

//支持静态文件访问
export default function KoaStatic(app: FastCarApplication): Koa.Middleware[] {
	let mlist: Koa.Middleware[] = [];
	let koaConfig: KoaConfig = app.getSetting("koa");

	if (!!koaConfig?.koaStatic) {
		let keys = Object.keys(koaConfig?.koaStatic);
		if (keys.length > 0) {
			for (let key of keys) {
				let { root: fp, options } = normalizeStaticConfig(koaConfig.koaStatic[key]);
				let rp = path.join(app.getResourcePath(), fp);
				if (!fs.existsSync(fp)) {
					if (!fs.existsSync(rp)) {
						console.error(`${fp} is not found`);
						continue;
					} else {
						fp = rp;
					}
				}

				mlist.push(createStaticMiddleware(key, fp, options));
			}
		}
	}
	return mlist;
}
