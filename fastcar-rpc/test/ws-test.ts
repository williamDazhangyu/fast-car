import { IncomingMessage } from "http";
import { createServer } from "https";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";

// const ssl = {
// 	cert: fs.readFileSync(path.join(__dirname, "example/resource/ssl/localhost-cert.crt")).toString(),
// 	key: fs.readFileSync(path.join(__dirname, "example/resource/ssl/localhost-key.pem")).toString(),
// };

// //服务端示例
// const server = createServer(ssl);
// const wss = new WebSocketServer({ server: server });

// wss.on("connection", function connection(ws, request: IncomingMessage) {
// 	console.log("ws", ws, request.socket.remoteAddress);

// 	ws.on("message", function message(data) {
// 		console.log("received: %s", data.toString());
// 		ws.close();
// 	});

// 	ws.on("close", function () {
// 		console.log("close client");
// 	});

// 	ws.send("server something");
// });

// server.listen(8080);

//客户端示例
const client = new WebSocket("wss://jjcms.ximiplay.com");

client.on("open", function open() {
	console.log("open");
	client.send("client something");
});

client.on("message", function message(data) {
	console.log("received: %s", data.toString());
});

client.on("close", function (code: number, reason: Buffer) {
	console.log("client close end", code, reason.toString());
});
