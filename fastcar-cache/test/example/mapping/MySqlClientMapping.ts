import CacheMapping from "../../../src/annotation/CacheMapping";
import { CacheConfig, Item } from "../../../src/CacheType";
import DBClientService from "../../../src/dbclient/DBClientService";
import { CallDependency } from "@fastcar/core/annotation";
import CacheMapper from "./sql/CacheMapper";
import CacheModel from "./sql/CacheModel";
import { DateUtil } from "@fastcar/core/utils";

@CacheMapping
export default class MySqlClientMapping implements CacheConfig {
	store: string = "mysqlStore";
	initSync: boolean = true;
	syncTimer: number = 10;
	ttl: number = 60; //60秒后过期
	dbClient: DBClientService;

	@CallDependency
	private cacheMapper!: CacheMapper;

	constructor() {
		//自定义构造一个存储器
		this.dbClient = {
			mset: async (list: Item[]) => {
				await this.cacheMapper.saveORUpdate(
					list.map((item) => {
						return new CacheModel(Object.assign(item, { updateTime: DateUtil.toDateTime() }));
					})
				);
				return true;
			},
			mget: async () => {
				let list = await this.cacheMapper.select({});
				return list;
			},
			mdelete: async (keys: string[]) => {
				await this.cacheMapper.delete({
					where: {
						key: keys,
					},
				});
				return true;
			},
		};
	}
}
