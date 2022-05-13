import { Item, Store } from "../CacheType";
/***
 * @version 1.0 持久化更新客户端
 *
 */
export default interface DBClientService {
	mget(): Promise<Item[]>; //读取批量数据 初始化的时候选择是否调用

	mset(list: Item[]): Promise<boolean>;

	mdelete(keys: string[]): Promise<boolean>;
}
