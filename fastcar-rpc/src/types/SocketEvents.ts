//socket 事件监听
export enum SocketEvents {
	CONNECT = "connect",
	CONNECT_RECEIPT = "connect_receipt",
	DISCONNECT = "disconnect",
	MESSAGE = "message", //接收消息
	SetSession = "setSession", //更新session回话
	CLOSE = "close",
}
