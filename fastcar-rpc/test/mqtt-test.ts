import { Server, Client, Subscription, AedesPublishPacket, PublishPacket } from "aedes";

const aedesInstance = Server({
	id: "aedes",
	authenticate: function (client, username, password, callback) {
		callback(null, username === "user" && password.toString() === "123456");
	},
	authorizePublish: function (client: Client, packet: PublishPacket) {
		console.log("服务端收到消息", packet.payload.toString());
	},
});
const server = require("net").createServer(aedesInstance.handle);

server.listen(1883, function () {
	console.log("开始喽");
});

// 客户端连接
aedesInstance.on("client", function (serverclient) {
	console.log("客户端连接", serverclient);
	// serverclient.publish(
	// 	{
	// 		topic: "message",
	// 		payload: "hello world",
	// 		cmd: "publish",
	// 		qos: 0,
	// 		retain: true,
	// 		dup: false,
	// 	},
	// 	() => {}
	// );
});

// 客户端断开
aedesInstance.on("clientDisconnect", function (client) {
	console.log("客户端断开");
});

import * as mqtt from "mqtt";
const client = mqtt.connect("mqtt://127.0.0.1:1883", {
	username: "user",
	password: "123456",
});

client.on("connect", function () {
	console.log("服务器连接成功");
	console.log(client.options.clientId);
	client.publish("message", JSON.stringify({ id: 1 })); // 发布主题text消息
});

client.on("disconnect", function () {});

client.on("message", function (topic: string, message: string | Buffer) {
	console.log("服务端消息", topic, message.toString());
});
