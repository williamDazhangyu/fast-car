import { RpcMetaData } from "../constant/RpcMetaData";
import { ProtoMeta } from "../types/PBConfig";
import * as fs from "fs";
import path = require("path");

/**
 * @version 1.0 解析协议所需的文件
 *
 */
export default function ProtoData(protoPath: string, serviceName?: string) {
	return function (target: any) {
		if (!fs.existsSync(protoPath)) {
			protoPath = path.join(__dirname, protoPath);
		}

		const d: ProtoMeta = {
			service: serviceName || target.name,
			protoPath,
		};
		Reflect.defineMetadata(RpcMetaData.ProtoDataConfig, d, target.prototype);
	};
}
