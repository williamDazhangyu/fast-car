import { ServerConfig } from "./src/type/ServerConfig";
import { ServerType } from "./src/type/ServerType";

export * from "./src/type/SSLConfig";

export * from "./src/type/Protocol";

export * from "./src/type/ServerConfig";

export * from "./src/type/ServerType";

export class ServerApplication {
	createServer(config: ServerConfig, appCallBack?: any): ServerType | null;

	getServer(port: number): ServerType | null;

	start(): void;

	stop(): void;
}

export function EnableServer(target: any): void;
