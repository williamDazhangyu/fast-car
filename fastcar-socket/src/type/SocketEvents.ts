//socket 事件监听
export enum SocketEvents {
	CONNECT = "connect",
	DISCONNECT = "disconnect",
	MESSAGE = "message", //接收消息
	SetSession = "setSession", //更新session回话
}
