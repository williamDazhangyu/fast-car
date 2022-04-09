//支持的长连接协议
export enum SocketEnum {
	SocketIO = "socket.io",
	MQTT = "mqtt",
	WS = "ws",
}

//长连接类型
export enum SocketServerEnum {
	RPC = "rpc",
	SOCKET = "socket",
}
