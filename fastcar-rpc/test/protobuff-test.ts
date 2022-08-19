// import * as path from "path";
// import * as protobufjs from "protobufjs";

// //加载proto
// const PROTO_PATH = path.join(__dirname, "demo.proto");
// const root = protobufjs.loadSync(PROTO_PATH);

// let service = root.lookupService("Hello");
// const AwesomeMessage = root.lookupType(service.methods.sayHello.requestType);
// //地址 key 规范为 request 和 response

// //转成buffer
// let message = AwesomeMessage.create({ message: "hello" });
// let buffer = AwesomeMessage.encode(message).finish();

// //转成json结构
// let decoded = AwesomeMessage.decode(buffer).toJSON();
// console.log(decoded);

import ProtoBuffService from "../src/service/ProtoBuffService";
import { EncodePBDefault, DecodePBDefault } from "../src/constant/SocketCodingDefault";

let b = EncodePBDefault({
	data: { hello: "world" },
	mode: 1,
	url: "/connnect",
});

console.log(DecodePBDefault(b));
console.log();
