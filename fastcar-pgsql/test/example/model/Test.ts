import "reflect-metadata";
import { Table, DBType, Field, PrimaryKey, NotNull, Size, IsSerial, CustomType } from "@fastcar/core/annotation";

@Table("test")
class Test {
	@Field("id")
	@DBType("bigint")
	@PrimaryKey
	@NotNull
	@IsSerial
	id!: number;

	/**
	 * 字符串的list解构
	 */
	@Field("list")
	@DBType("jsonb")
	@CustomType("json")
	list!: any;

	/**
	 * 创建时间
	 */
	@Field("create_time")
	@DBType("timestamp without time zone")
	createTime!: Date;

	/**
	 * 更新时间
	 */
	@Field("update_time")
	@DBType("timestamp with time zone")
	updateTime!: Date;

	/**
	 * 时间
	 */
	@Field("name")
	@DBType("character varying")
	@Size({ maxSize: 255 })
	name!: string;

	@Field("case_name")
	@DBType("character varying")
	@Size({ maxSize: 255 })
	caseName!: string;

	@Field("num_int")
	@DBType("integer")
	numInt!: number;

	/**
	 * 货币类型
	 */
	@Field("money")
	@DBType("money")
	money!: string;

	/**
	 * 浮点类型数字
	 */
	@Field("num_float")
	@DBType("double precision")
	numFloat!: number;

	/**
	 * bool类型
	 */
	@Field("flag")
	@DBType("boolean")
	flag: boolean = false;

	/**
	 * uuid举例
	 */
	@Field("l_uuid")
	@DBType("uuid")
	lUuid!: string;

	/**
	 * ipv4
	 */
	@Field("local_ip")
	@DBType("inet")
	localIp!: string;

	constructor(args?: Partial<Test>) {
		if (args) {
			Object.assign(this, args);
		}
	}

	toObject() {
		return {
			id: this.id,
			list: this.list,
			createTime: this.createTime?.getTime(),
			updateTime: this.updateTime?.getTime(),
			name: this.name,
			caseName: this.caseName,
			numInt: this.numInt,
			money: this.money,
			numFloat: this.numFloat,
			flag: this.flag,
			lUuid: this.lUuid,
			localIp: this.localIp,
		};
	}
}

export default Test;
