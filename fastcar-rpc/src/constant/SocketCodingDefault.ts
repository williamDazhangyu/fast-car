import { DecodeMsg, EncodeMsg } from "../types/SocketConfig";

export const EncodeDefault: EncodeMsg = (msg: Object) => {
	return JSON.stringify(msg);
};

export const DecodeDefault: DecodeMsg = (msg: string | Buffer) => {
	if (typeof msg == "string") {
		return JSON.parse(msg);
	}

	return msg;
};
