//支持的长连接协议
export enum SocketEnum {
	SocketIO = "socket.io",
	MQTT = "mqtt",
	WS = "ws",
	Grpc = "grpc",
}

//长连接类型
export enum SocketServerEnum {
	RPC = "rpc",
	SOCKET = "socket",
}
