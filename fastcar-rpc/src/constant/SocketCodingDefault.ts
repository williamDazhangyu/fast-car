import { DecodeMsg, EncodeMsg } from "../types/SocketConfig";
import { RpcMessage, InteractiveMode } from "../types/RpcConfig";
import ProtoBuffService from "../service/ProtoBuffService";
import { ValidationUtil } from "@fastcar/core/utils";

export const EncodeDefault: EncodeMsg = (msg: RpcMessage) => {
	return JSON.stringify(msg);
};

export const DecodeDefault: DecodeMsg = (msg: string | Buffer | Buffer[] | ArrayBuffer) => {
	if (Buffer.isBuffer(msg)) {
		msg = msg.toString();
	}

	if (typeof msg == "string") {
		try {
			let obj = JSON.parse(msg);
			if (!!obj && typeof obj === "object") {
				return obj;
			}
		} catch (e) {}
	}

	return msg;
};

//关于protobuff的压缩
export const EncodePBDefault: EncodeMsg = (msg: RpcMessage) => {
	//先翻译data的数据
	let data: RpcMessage = {
		url: msg.url,
		mode: msg.mode,
	};

	if (ValidationUtil.isNotNull(msg.data) && msg.data) {
		data.data = ProtoBuffService.encode(msg.data, msg.url, InteractiveMode.request == msg.mode);
	}

	if (ValidationUtil.isNotNull(msg.id)) {
		data.id = msg.id;
	}

	let tests = ProtoBuffService.encodeRoute(data);

	//再整体计算
	return tests;
};

export const DecodePBDefault: DecodeMsg = (msg: string | Buffer | Buffer[] | ArrayBuffer) => {
	let data = ProtoBuffService.decodeRoute(msg as Uint8Array);

	let bytes = data.data;

	if (ValidationUtil.isNotNull(bytes)) {
		data.data = ProtoBuffService.decode(bytes, data.url, InteractiveMode.request == data.mode);
	}

	return data as RpcMessage;
};

//关于grpc的压缩
export const EncodePBGrpcDefault: (msg: RpcMessage) => RpcMessage = (msg: RpcMessage) => {
	//先翻译data的数据
	let data: RpcMessage = {
		url: msg.url,
		mode: msg.mode,
	};

	if (ValidationUtil.isNotNull(msg.data) && msg.data) {
		data.data = ProtoBuffService.encode(msg.data, msg.url, InteractiveMode.request == msg.mode);
	}

	if (ValidationUtil.isNotNull(msg.id)) {
		data.id = msg.id;
	}

	//再整体计算
	return data;
};

export const DecodePBGrpcDefault: (msg: RpcMessage) => RpcMessage = (data: RpcMessage) => {
	let bytes = data.data as number[];
	if (ValidationUtil.isNotNull(bytes)) {
		data.data = ProtoBuffService.decode(bytes, data.url, InteractiveMode.request == data.mode);
	}

	return data as RpcMessage;
};
