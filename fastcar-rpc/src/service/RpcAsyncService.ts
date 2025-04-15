//异步回调消息
export default interface RpcAsyncService {
	handleMsg(url: string, data: Object): Promise<Object | void>;

	loginAfter?(index: number): Promise<Boolean>;
}
