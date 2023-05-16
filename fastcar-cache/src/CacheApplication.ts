import { ApplicationStart, ApplicationStop, Log } from "@fastcar/core/annotation";
import { BootPriority, DataMap, Logger } from "@fastcar/core";
import { CacheConfig, CacheConfigTarget, CacheMappingSymbol, CacheSetOptions, DBItem, Item, QueueItem, Store } from "./CacheType";
import { EnableScheduling, ScheduledInterval } from "@fastcar/timer";
import { ValidationUtil } from "@fastcar/core/utils";

@ApplicationStart(BootPriority.Common, "start")
@ApplicationStop(BootPriority.Common, "stop")
@EnableScheduling
export default class CacheApplication {
	@Log("cache")
	private logger!: Logger;

	private _dataMapping: DataMap<Store, DBItem<any>>;
	private _syncStatus: DataMap<Store, boolean>;

	constructor() {
		this._dataMapping = new DataMap();
		this._syncStatus = new DataMap();
	}

	/***
	 * @version 1.0 初始化创造节点
	 */
	private createMapping<T>(config: DBItem<T>): void {
		if (!this._dataMapping.has(config.store)) {
			this._dataMapping.set(config.store, config);
			return;
		}

		this._dataMapping.set(config.store, Object.assign(this._dataMapping.get(config.store) || {}, config));
	}

	/**
	 * @version 1.0 获取当前节前信息
	 */
	getStore<T>(store: string): DBItem<T> | null {
		return this._dataMapping.get(store) || null;
	}

	/***
	 * @version 1.0 进行set赋值 过期时间 单位秒 0为不过期
	 */
	set<T>(store: string, key: string, val: T, options: CacheSetOptions = {}): boolean {
		let mapping = this.getStore(store);

		if (!mapping) {
			return false;
		}

		mapping.data.set(key, val);

		//针对缓存的处理
		let ttl = mapping.ttl;
		if (Reflect.has(options, "ttl")) {
			ttl = Reflect.get(options, "ttl") as number;
		}

		if (!ValidationUtil.isNumber(ttl)) {
			ttl = 0;
		}

		//如果不存在过期 更新时长
		if (ttl == 0) {
			if (mapping.ttlMap.has(key)) {
				mapping.ttlMap.delete(key);
			}
		} else {
			//刷新过期时间
			mapping.ttlMap.set(key, {
				ttl: ttl * 1000,
				interval: ttl * 1000,
				failNum: mapping.failNum,
			});
		}

		//针对数据同步的处理
		if (mapping.dbClient) {
			if (!mapping.syncMap?.has(key) || options.flush) {
				mapping.syncMap?.set(key, {
					ttl: options.flush ? 0 : mapping.syncTimer * 1000,
					interval: mapping.syncTimer * 1000, //同步周期
					failNum: mapping.failNum, //失败次数
				});
			}
		}

		return true;
	}

	//获取数据
	get<T>(store: string, key: string): null | T {
		let mapping = this.getStore(store);

		if (!mapping) {
			return null;
		}

		let val = mapping.data.get(key) as T;
		return ValidationUtil.isNotNull(val) ? val : null;
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

		let item = mapping.ttlMap.get(key);
		if (item) {
			return Math.ceil(item.ttl / 1000);
		}

		return 0;
	}

	//获取某一类
	getDictionary<T>(store: string): { [key: string]: T } {
		let mapping = this.getStore(store);

		if (!mapping) {
			return {};
		}

		return mapping.data.toObject() as { [key: string]: T };
	}

	@ScheduledInterval({ fixedRate: 100 })
	loop(diff: number): void {
		//先计算同步数据 再清除掉缓存数据
		this._dataMapping.forEach(async (mapping, store) => {
			let data = mapping.data;
			let syncMap = mapping.syncMap;

			//先执行同步数据操作
			if (mapping.dbClient) {
				if (syncMap) {
					//当上一次的状态未同步时 则无法继续
					if (this._syncStatus.get(store)) {
						return;
					}

					this._syncStatus.set(store, true);

					//进行精细化操作
					let syncList: Item<any>[] = [];
					let newSyncMap = new DataMap<string, QueueItem>();
					let syncPendingMap = new DataMap<string, QueueItem>();

					syncMap.forEach((t, key) => {
						t.ttl -= diff;
						if (t.ttl <= 0) {
							//需要同步的周期
							syncList.push({
								key,
								value: data.get(key),
								ttl: this.getTTL(store, key),
							});
							syncPendingMap.set(key, t);
						} else {
							//保留待更新的map节点
							newSyncMap.set(key, t);
						}
					});
					mapping.syncMap = newSyncMap;
					if (syncList.length > 0) {
						//进行持久化
						let flag = false;
						try {
							if (mapping.readonly) {
								let keys = syncList.map((i) => {
									return i.key;
								});
								//遍历进行同步赋值
								this.initData(keys);
							} else {
								flag = await mapping.dbClient.mset(syncList);
							}
						} catch (e: any) {
							this.logger.error(`sync  ${store} update data error`);
							this.logger.error(e);
						} finally {
							if (!flag) {
								//重新塞入 下次再读取
								syncList.forEach((item) => {
									let citem = syncPendingMap.get(item.key);
									if (citem) {
										citem.failNum--;
										if (citem.failNum > 0) {
											mapping?.syncMap?.set(item.key, {
												failNum: citem.failNum,
												interval: citem.interval,
												ttl: citem.interval,
											});
										}
									}
								});
								this.logger.error(`${mapping.store} mset fail in [${JSON.stringify(syncList)}]`);
							}
							syncPendingMap.clear();
						}
					}

					this._syncStatus.set(store, false);
				}
			}

			//再执行删除缓存操作
			let ttlMap = mapping.ttlMap;
			if (ttlMap.size > 0) {
				let newTllMap = new DataMap<string, QueueItem>();
				let ttlPendingMap = new DataMap<string, QueueItem>();
				let ttlKeys: string[] = [];
				ttlMap.forEach((t, key) => {
					t.ttl -= diff;
					if (t.ttl <= 0 && !syncMap?.has(key)) {
						//当同步未结束时也不能进行删除
						ttlKeys.push(key);
						ttlPendingMap.set(key, t);
					} else {
						newTllMap.set(key, t);
					}
				});
				mapping.ttlMap = newTllMap;

				let flag: boolean = true;
				if (ttlKeys.length > 0) {
					if (mapping.dbClient) {
						try {
							if (mapping.dbSync) {
								flag = await mapping.dbClient.mdelete(ttlKeys);
							} else {
								flag = true;
							}
						} catch (e) {
							this.logger.error(`sync  ${store} delete data error`);
							this.logger.error(e);
						} finally {
							//修改为不再重复删除节点
							if (!flag) {
								this.logger.error(`${mapping.store} mdelete fail in [${ttlKeys.join(",")}]`);

								ttlKeys.forEach((key) => {
									let citem = ttlPendingMap.get(key);
									if (citem) {
										citem.failNum--;
										if (citem.failNum > 0) {
											mapping.ttlMap.set(key, {
												failNum: citem.failNum,
												interval: citem.interval,
												ttl: citem.interval,
											});
										}
									}
								});
							}
							ttlPendingMap.clear();
						}
					}

					ttlKeys.forEach((key) => {
						mapping.data.delete(key);
					});
				}
			}
		});
	}

	//读取数据
	async initData(keys?: string[]): Promise<void> {
		for (let [store, item] of this._dataMapping) {
			if (item.dbClient && item.initSync) {
				let list = await item.dbClient.mget(keys);
				list.forEach((l) => {
					this.set(store, l.key, l.value, {
						ttl: l.ttl,
					});
				});
			}
		}
	}

	//关闭时 将持久化未及时同步的数据
	async stop(): Promise<void> {
		//停止循环
		Reflect.apply(this.loop, this, [0, true]);
		for (let [store, item] of this._dataMapping) {
			if (item.dbClient) {
				let syncMap = item.syncMap;
				if (syncMap && syncMap.size > 0) {
					let list: Item<any>[] = [];
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
			failNum: item?.failNum || 3,
			readonly: item.readonly || false,
			dbSync: ValidationUtil.isBoolean(item.dbSync) ? item.dbSync : true,
		});
	}
}
