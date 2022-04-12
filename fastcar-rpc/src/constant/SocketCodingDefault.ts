import { DecodeMsg, EncodeMsg } from "../types/SocketConfig";

export const EncodeDefault: EncodeMsg = (msg: Object) => {
	return JSON.stringify(msg);
};

export const DecodeDefault: DecodeMsg = (msg: string | Buffer) => {
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
