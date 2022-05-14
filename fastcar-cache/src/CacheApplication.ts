import { ApplicationStart, ApplicationStop, Log } from "fastcar-core/annotation";
import { BootPriority, DataMap, Logger } from "fastcar-core";
import { CacheConfig, CacheConfigTarget, CacheMappingSymbol, CacheSetOptions, DBItem, Item, Store } from "./CacheType";
import { EnableScheduling, ScheduledInterval } from "fastcar-timer";

@ApplicationStart(BootPriority.Common, "start")
@ApplicationStop(BootPriority.Common, "stop")
@EnableScheduling
export default class CacheApplication {
	@Log("sys")
	private logger!: Logger;

	private _dataMapping: DataMap<Store, DBItem>;
	private _syncStatus: DataMap<Store, boolean>;

	constructor() {
		this._dataMapping = new DataMap();
		this._syncStatus = new DataMap();
	}

	//创造节点
	createMapping(config: DBItem): void {
		if (!this._dataMapping.has(config.store)) {
			this._dataMapping.set(config.store, config);
			return;
		}

		let beforeConfig = this._dataMapping.get(config.store);
		this._dataMapping.set(config.store, Object.assign(beforeConfig, config));
	}

	getStore(store: string): DBItem | null {
		return this._dataMapping.get(store) || null;
	}

	//进行set赋值 过期时间 单位秒 0为不过期
	set(store: string, key: string, val: any, options: CacheSetOptions = {}): boolean {
		let mapping = this.getStore(store);

		if (!mapping) {
			return false;
		}

		mapping.data.set(key, val);

		//针对缓存的处理
		let ttl = mapping.ttl;
		if (Reflect.has(options, "ttl")) {
			ttl = Reflect.get(options, "ttl");
		}
		ttl = ttl || 0;

		//如果不存在过期
		if (!ttl) {
			if (mapping.ttlMap.has(key)) {
				mapping.ttlMap.delete(key);
			}
		} else {
			mapping.ttlMap.set(key, ttl * 1000);
		}

		//针对数据同步的处理
		if (mapping.dbClient) {
			if (!mapping.syncMap?.has(key) || options.flush) {
				mapping.syncMap?.set(key, options.flush ? 0 : mapping.syncTimer * 1000);
			}
		}

		return true;
	}

	//获取数据
	get(store: string, key: string): null | any {
		let mapping = this.getStore(store);

		if (!mapping) {
			return null;
		}

		return mapping.data.get(key);
	}

	delete(store: string, key: string): boolean {
		let mapping = this.getStore(store);

		if (!mapping) {
			return false;
		}

		mapping.data.delete(key);

		if (mapping.ttlMap.has(key)) {
			mapping.ttlMap.delete(key);
		}

		if (mapping.syncMap?.has(key)) {
			mapping.syncMap.delete(key);
		}

		if (mapping.dbClient) {
			mapping.dbClient.mdelete([key]);
		}

		return true;
	}

	//获取是否存在key
	has(store: string, key: string): boolean {
		let mapping = this.getStore(store);

		if (!mapping) {
			return false;
		}

		return mapping.data.has(key);
	}

	//获取存在的时间
	getTTL(store: string, key: string): number {
		let mapping = this.getStore(store);

		if (!mapping) {
			return 0;
		}

		let time = mapping.ttlMap.get(key);
		if (time) {
			return Math.ceil(time / 1000);
		}

		return 0;
	}

	//获取某一类
	getDictionary(store: string): { [key: string]: any } {
		let mapping = this.getStore(store);

		if (!mapping) {
			return {};
		}

		return mapping.data.toObject();
	}

	@ScheduledInterval({ fixedRate: 100 })
	loop(diff: number, status: boolean = false): void {
		//先计算同步数据
		//再清除掉缓存数据
		this._dataMapping.forEach(async (mapping, store) => {
			let data = mapping.data;

			let syncMap = mapping.syncMap;
			if (mapping.dbClient) {
				if (syncMap) {
					//当上一次的状态未同步时 则无法继续
					if (this._syncStatus.get(store)) {
						return;
					}

					this._syncStatus.set(store, true);
					let syncList: Item[] = [];
					let newSyncMap = new DataMap<string, number>();
					syncMap.forEach((t, key) => {
						t -= diff;
						if (t <= 0) {
							syncList.push({
								key,
								value: data.get(key),
								ttl: this.getTTL(store, key),
							});
						} else {
							newSyncMap.set(key, t);
						}
					});
					mapping.syncMap = newSyncMap;

					if (syncList.length > 0) {
						//进行持久化
						let flag = false;
						try {
							flag = await mapping.dbClient.mset(syncList);
						} catch (e: any) {
							this.logger.error(`sync  ${store} data error`);
							this.logger.error(e);
						} finally {
							if (!flag) {
								//重新塞入 下次再读取
								syncList.forEach((item) => {
									newSyncMap.set(item.key, 0);
								});
							}
						}
					}

					this._syncStatus.set(store, false);
				}
			}

			let ttlMap = mapping.ttlMap;
			if (ttlMap.size > 0) {
				let newTllMap = new DataMap<string, number>();
				let ttlKeys: string[] = [];
				ttlMap.forEach((t, key) => {
					t -= diff;
					if (t <= 0 && !syncMap?.has(key)) {
						//当同步未结束时也不能进行删除
						ttlKeys.push(key);
					} else {
						newTllMap.set(key, t);
					}
				});

				let flag: boolean = true;
				if (ttlKeys.length > 0) {
					if (mapping.dbClient) {
						flag = await mapping.dbClient.mdelete(ttlKeys);
					}

					ttlKeys.forEach((key) => {
						mapping.data.delete(key);
					});
				}

				if (flag) {
					mapping.ttlMap = newTllMap;
				}
			}
		});
	}

	//读取数据
	async initData(): Promise<void> {
		for (let [store, item] of this._dataMapping) {
			if (item.dbClient && item.initSync) {
				let list = await item.dbClient.mget();
				list.forEach((l) => {
					item.data.set(l.key, l.value);
					if (l.ttl > 0) {
						if (item.dbClient) {
							item.ttlMap.set(l.key, l.ttl);
						}
					}
				});
			}
		}
	}

	//关闭时 将持久化未及时同步的数据
	async stop(): Promise<void> {
		//停止循环
		this.loop(0, true);
		for (let [store, item] of this._dataMapping) {
			if (item.dbClient) {
				let syncMap = item.syncMap;
				if (syncMap && syncMap.size > 0) {
					let list: Item[] = [];
					syncMap.forEach((t, key) => {
						list.push({
							key,
							value: item.data.get(key),
							ttl: this.getTTL(store, key),
						});
					});

					await item.dbClient.mset(list);
				}
			}
		}
	}

	async start(): Promise<void> {
		let cacheList: CacheConfigTarget[] = Reflect.get(global, CacheMappingSymbol);
		if (cacheList && Array.isArray(cacheList)) {
			cacheList.forEach((item) => {
				let config = new item();
				this.addStore(config);
			});
		}

		this.initData();
	}

	addStore(item: CacheConfig): void {
		this.createMapping({
			store: item.store, //存储的对象
			data: new DataMap(), //存放key
			initSync: item.initSync || false, //是否需要初始化同步
			syncTimer: item.syncTimer || 0, //多少秒同步一次 仅持久化 0 为立即同步
			ttl: item.ttl || 0, //0 代表永远不消失
			ttlMap: new DataMap(), //过期需删除的key值
			dbClient: item.dbClient, //持久化存储的客户端
			syncMap: new DataMap(), //需要同步持久化的key
		});
	}
}
