import * as grpc from "@grpc/grpc-js";

import * as path from "path";
import * as protoLoader from "@grpc/proto-loader";
import * as fs from "fs";

//加载proto
const PROTO_PATH = path.join(__dirname, "demo.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const hello_proto = protoDescriptor as any;

function sayHello(call: any, callback: Function) {
	callback(null, { message: `echo: ` + call.request.message });
}

function sayHelloStream(call: any) {
	// call.metadata.set("sessionId", Date.now());

	call.on("data", function (request: any) {
		console.log("消息", request.message);
		call.write({ message: `echo: ` + request.message });
	});
	call.on("end", function () {
		call.end();
	});
}

function main() {
	var server = new grpc.Server();
	server.addService(hello_proto["Hello"].service, { sayHello, sayHelloStream });
	let cert = grpc.ServerCredentials.createSsl(
		fs.readFileSync(path.join(__dirname, "example/resource/test/ca.crt")),
		[
			{
				cert_chain: fs.readFileSync(path.join(__dirname, "example/resource/test/server.crt")),
				private_key: fs.readFileSync(path.join(__dirname, "example/resource/test/server.key")),
			},
		],
		true
	);
	server.bindAsync("local.dev.com:50051", cert, () => {
		server.start();
		console.log("grpc server started");
	});
}

main();

function clientMain() {
	let cert = grpc.credentials.createSsl(
		fs.readFileSync(path.join(__dirname, "example/resource/test/ca.crt")),
		fs.readFileSync(path.join(__dirname, "example/resource/test/client.key")),
		fs.readFileSync(path.join(__dirname, "example/resource/test/client.crt"))
	);

	let client = new hello_proto.Hello("local.dev.com:50051", cert, { "grpc.ssl_target_name_override": "example", "grpc.default_authority": "example" });
	let streamHello = client.sayHelloStream();

	streamHello.on("data", function (response: any) {
		console.log("客户端receive:", response);
	});

	streamHello.on("end", function () {
		console.log("服务器发送end,客户端关闭");
	});

	streamHello.write({ message: "来自客户端的调用" });
	streamHello.write({ message: "world" });
	streamHello.end();
}

setTimeout(() => {
	clientMain();
}, 1000);
