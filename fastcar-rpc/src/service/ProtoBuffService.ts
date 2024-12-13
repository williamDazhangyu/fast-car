import { PBConfig, ProtoRoot } from "../types/PBConfig";
import * as protobufjs from "protobufjs";
import { Root } from "protobufjs";
import path = require("path");
import { RpcMessage } from "../types/RpcConfig";
import { BeanName } from "@fastcar/core/annotation";

/**
 * @version 1.0 protobuff 协议管理器
 */
@BeanName("ProtoBuffService")
export default class ProtoBuffService {
	private urlMapping: Map<string, PBConfig>;
	private rootMapping: Map<string, ProtoRoot>;
	private routeRoot: Root;
	private routeHandleType: protobufjs.Type;
	private rootPath: string;

	constructor() {
		this.urlMapping = new Map();
		this.rootMapping = new Map();
		//默认加载router.proto
		this.rootPath = path.join(__dirname, "../../protobuff", "router.proto");
		this.routeRoot = this.addProtoRoot(this.rootPath);

		//取出类型
		let service = this.routeRoot.lookupService("Router");
		let method = service.methods["transferRoute"];
		this.routeHandleType = this.routeRoot.lookupType(method.requestType);
	}

	getRouteRoot() {
		return this.routeRoot;
	}

	getRouterRootPath() {
		return this.rootPath;
	}

	addProtoRoot(fp: string): Root {
		let content = this.rootMapping.get(fp);
		if (!!content) {
			return content.root;
		}

		const root = protobufjs.loadSync(fp);
		this.rootMapping.set(fp, {
			protoPath: fp,
			root,
		});

		return root;
	}

	addUrlMapping(p: PBConfig): boolean {
		if (this.urlMapping.has(p.url)) {
			return true;
		}

		this.addProtoRoot(p.protoPath);
		this.urlMapping.set(p.url, p);

		return true;
	}

	//根据url进行压缩  type 向上true还是向下false
	encode(msg: { [key: string]: any }, url: string, type: boolean): number[] {
		let urlConfig = this.urlMapping.get(url);
		if (!!urlConfig) {
			let rootM = this.rootMapping.get(urlConfig.protoPath);
			if (rootM) {
				let root = rootM.root;
				let service = root.lookupService(urlConfig.service);

				let method = service.methods[urlConfig.method];
				let reType = type ? method.requestType : method.responseType;
				const HandleMessage = root.lookupType(reType);

				let message = HandleMessage.create(msg);
				let buffer = HandleMessage.encode(message).finish();
				return Array.from(buffer);
			}
		}

		return Array.from(Buffer.from(JSON.stringify(msg)));
	}

	decode(buffer: number[], url: string, type: boolean): { [k: string]: any } {
		let urlConfig = this.urlMapping.get(url);
		if (!!urlConfig) {
			let rootM = this.rootMapping.get(urlConfig.protoPath);
			if (rootM) {
				let root = rootM.root;
				let service = root.lookupService(urlConfig.service);

				let method = service.methods[urlConfig.method];
				let reType = type ? method.requestType : method.responseType;
				const HandleMessage = root.lookupType(reType);

				let bytes: Uint8Array = Buffer.from(buffer);
				let message = HandleMessage.decode(bytes).toJSON();
				return message;
			}
		}

		if (Array.isArray(buffer) || typeof buffer == "string") {
			let finalMsg = Buffer.from(buffer).toString();
			try {
				let obj = JSON.parse(finalMsg);
				if (!!obj && typeof obj === "object") {
					return obj;
				}
			} catch (e) {}
		}

		return buffer;
	}

	//路由压缩
	encodeRoute(msg: RpcMessage): Buffer {
		let message = this.routeHandleType.create(msg);
		return this.routeHandleType.encode(message).finish() as Buffer;
	}

	//路由消息解压
	decodeRoute(buffer: Uint8Array): { [k: string]: any } {
		return this.routeHandleType.decode(buffer).toJSON();
	}
}
