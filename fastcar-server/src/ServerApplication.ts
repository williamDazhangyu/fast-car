import { ApplicationStart, ApplicationStop, Autowired, Log } from "@fastcar/core/annotation";
import { BootPriority, Logger } from "@fastcar/core";
import { ServerConfig } from "./type/ServerConfig";
import { Protocol } from "./type/Protocol";
import { FastCarApplication } from "@fastcar/core";
import { ServerType } from "./type/ServerType";
import { SSLConfig } from "./type/SSLConfig";

type port = number;
type ServerDetail = {
	server: ServerType;
	config: ServerConfig;
};

@ApplicationStart(BootPriority.Lowest * 100, "start")
@ApplicationStop(BootPriority.Lowest * 100, "stop")
export default class ServerApplication {
	protected serverMap: Map<port, ServerDetail>;

	@Autowired
	private app!: FastCarApplication;

	@Log("sys")
	private serverlogger!: Logger;

	constructor() {
		this.serverMap = new Map();
	}

	private createSecureContext(cert: SSLConfig) {
		return require("tls").createSecureContext({
			key: cert.key,
			cert: cert.cert,
		}).context;
	}

	private getServerOpts(config: ServerConfig) {
		let serverOpts = config.options || {};
		if (!!config.ssl) {
			Object.assign(serverOpts, {
				key: this.app.getFileContent(config.ssl?.key),
				cert: this.app.getFileContent(config.ssl?.cert),
				ca: config.ssl?.ca ? this.app.getFileContent(config.ssl?.ca) : "",
			});
		}

		if (!!config.ssls) {
			Object.keys(config.ssls).forEach((key) => {
				let sslInfo = config.ssls?.[key] as SSLConfig & { context: any };
				Object.assign(sslInfo, {
					key: this.app.getFileContent(sslInfo?.key),
					cert: this.app.getFileContent(sslInfo?.cert),
					ca: sslInfo?.ca ? this.app.getFileContent(sslInfo?.ca) : "",
				});

				sslInfo.context = this.createSecureContext(sslInfo);
			});
			//则添加动态的ssl证书
			Object.assign(serverOpts, {
				SNICallback: (servername: string, cb: (err: Error | null, ctx?: any) => void) => {
					let sslInfo = config.ssls?.[servername] as any;
					if (!sslInfo) {
						return cb(new Error(`ssl cert not found`));
					}
					cb(null, sslInfo.context);
				},
			});
		}

		return serverOpts;
	}

	createServer(config: ServerConfig, appCallBack?: any): ServerType | null {
		if (!config.protocol) {
			config.protocol = Protocol.http;
		}

		if (!config.port) {
			config.port = config.ssl ? 443 : 80;
		}

		let beforeServer = this.getServer(config.port);
		if (!!beforeServer) {
			return beforeServer;
		}

		let server: ServerType;
		switch (config.protocol) {
			case Protocol.http: {
				server = require("http").createServer(this.getServerOpts(config), appCallBack);
				break;
			}
			case Protocol.https: {
				if (!config.ssl && !config.ssls) {
					this.serverlogger.error(`https requires ssl config`);
					process.exit();
				}
				server = require("https").createServer(this.getServerOpts(config), appCallBack);
				break;
			}
			case Protocol.http2: {
				if (!config.ssl && !config.ssls) {
					server = require("http2").createServer(this.getServerOpts(config));
				} else {
					server = require("http2").createSecureServer(this.getServerOpts(config), appCallBack);
				}
				break;
			}
			case Protocol.net: {
				server = require("net").createServer(this.getServerOpts(config), appCallBack);
				break;
			}
			case Protocol.tls: {
				if (!config.ssl && !config.ssls) {
					this.serverlogger.error(`tsl requires ssl config`);
					process.exit();
				} else {
					server = require("tls").createServer(this.getServerOpts(config), appCallBack);
				}
				break;
			}
			default: {
				return null;
			}
		}

		this.serverMap.set(config.port, {
			server,
			config,
		});

		return server;
	}

	getServer(port: number): ServerType | null {
		let info = this.serverMap.get(port);
		return !!info ? info.server : null;
	}

	getDefaultPort() {}

	start() {
		for (let [port, info] of this.serverMap) {
			let listentCallBack = () => {
				this.serverlogger.info(`${info.config.protocol} server is running in ${info.config.port}`);
			};

			if (!!info.config.hostname) {
				info.server.listen(port, info.config.hostname, listentCallBack);
			} else {
				info.server.listen(port, listentCallBack);
			}
		}
	}

	stop() {
		for (let [port, info] of this.serverMap) {
			info.server.close(() => {
				this.serverlogger.info(`server is stop in ${port}`);
			});
		}

		setTimeout(() => {
			this.serverMap.clear();
		}, 1000);
	}
}
