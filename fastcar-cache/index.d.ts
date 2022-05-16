import { CacheConfig, CacheConfigTarget, CacheSetOptions, DBItem, Item } from "./src/CacheType";

export * from "./src/CacheType";

export function CacheMapping(target: CacheConfigTarget): void;

export function EnableCache(target: any): void;

export class FSClient implements DBClientService {
	private filepath: string;

	constructor(filepath: string);

	mget(): Promise<Item[]>;

	mset(list: Item[]): Promise<boolean>;

	mdelete(keys: string[]): Promise<boolean>;
}

export interface DBClientService {
	mget(): Promise<Item[]>; //读取批量数据 初始化的时候选择是否调用

	mset(list: Item[]): Promise<boolean>;

	mdelete(keys: string[]): Promise<boolean>;
}

export class CacheApplication {
	constructor();

	//创造节点
	createMapping(config: DBItem): void;

	getStore(store: string): DBItem | null;

	//进行set赋值 过期时间 单位秒 0为不过期
	set(store: string, key: string, val: any, options?: CacheSetOptions): boolean;

	//获取数据
	get(store: string, key: string): null | any;

	//删除数据
	delete(store: string, key: string): boolean;

	//获取是否存在key
	has(store: string, key: string): boolean;

	//获取存在的时间
	getTTL(store: string, key: string): number;

	//获取某一类
	getDictionary(store: string): { [key: string]: any };

	//读取数据
	initData(): Promise<void>;

	//关闭时 将持久化未及时同步的数据
	stop(): Promise<void>;

	start(): Promise<void>;

	addStore(item: CacheConfig): void;
}
