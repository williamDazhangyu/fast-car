import { CacheConfig, CacheConfigTarget, CacheSetOptions, DBItem, Item } from "./src/CacheType";

export * from "./src/CacheType";

export function CacheMapping(target: CacheConfigTarget): void;

export function EnableCache(target: any): void;

export class FSClient<T> implements DBClientService<T> {
	private filepath: string;

	constructor(filepath: string);

	mget(): Promise<Item<T>[]>;

	mset(list: Item<T>[]): Promise<boolean>;

	mdelete(keys: string[]): Promise<boolean>;
}

export interface DBClientService<T> {
	mget(keys?: string[]): Promise<Item<T>[]>; //读取批量数据 初始化的时候选择是否调用

	mset(list: Item<T>[]): Promise<boolean>;

	mdelete(keys: string[]): Promise<boolean>;
}

export default class CacheApplication {
	/***
	 * @version 1.0 初始化创造节点
	 */
	private createMapping<T extends Object>(config: DBItem<T>): void;

	/**
	 * @version 1.0 获取当前节前信息
	 */
	getStore<T extends Object>(store: string): DBItem<T> | null;

	/***
	 * @version 1.0 进行set赋值 过期时间 单位秒 0为不过期
	 */
	set<T>(store: string, key: string, val: T, options?: CacheSetOptions): boolean;

	//获取数据
	get<T>(store: string, key: string): null | T;

	delete(store: string, key: string): boolean;

	//获取是否存在key
	has(store: string, key: string): boolean;

	//获取存在的时间
	getTTL(store: string, key: string): number;

	//获取某一类
	getDictionary<T>(store: string): { [key: string]: T };

	loop(diff: number): void;

	//读取数据
	initData(keys?: string[]): Promise<void>;

	//关闭时 将持久化未及时同步的数据
	stop(): Promise<void>;

	start(): Promise<void>;

	addStore(item: CacheConfig): void;
}
