import { Table, Field, DBType, PrimaryKey } from "@fastcar/core/annotation";
import "reflect-metadata";

@Table("cache")
class CacheModel {
	@Field("key")
	@DBType("varchar")
	@PrimaryKey
	key!: string;

	@Field("value")
	@DBType("varchar")
	value!: string;

	@Field("ttl")
	@DBType("int")
	ttl!: number;

	@Field("update_time")
	updateTime!: Date;

	constructor(...args: any) {
		Object.assign(this, ...args);
	}
}

export default CacheModel;
