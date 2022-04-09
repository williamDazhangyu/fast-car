import { Middleware } from "../types/RpcConfig";

export default interface RPCErrorService {
	response(): Middleware;
}
