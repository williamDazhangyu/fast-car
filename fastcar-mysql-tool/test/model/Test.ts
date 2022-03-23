import "reflect-metadata";
import { DateUtil } from "fastcar-core/utils";
import { Table, DBType, Field, PrimaryKey, Size, NotNull } from "fastcar-core/annotation";

@Table("test")
class Test {
	@Field("id")
	@DBType("int")
	@PrimaryKey
	@Size({ maxSize: 9999999999 })
	id!: number;

	/**
	 * name
	 */
	@Field("name")
	@DBType("varchar")
	@Size({ maxSize: 20 })
	name: string = "";

	/**
	 * case_name
	 */
	@Field("case_name")
	@DBType("varchar")
	@NotNull
	@Size({ maxSize: 10 })
	caseName: string = "haha";

	/**
	 * 案例时间
	 */
	@Field("case_time")
	@DBType("datetime")
	@NotNull
	caseTime: Date = new Date("2022-03-23 00:00:00");

	@Field("flag")
	@DBType("tinyint")
	@NotNull
	@Size({ maxSize: 3 })
	flag: boolean = true;

	@Field("money")
	@DBType("decimal")
	@NotNull
	@Size({ maxSize: 99999999.99 })
	money: number = 1;

	constructor(...args: any[]) {
		Object.assign(this, ...args);
	}

	toObject() {
		return {
			id: this.id,
			name: this.name,
			caseName: this.caseName,
			caseTime: DateUtil.toDateTime(this.caseTime),
			flag: this.flag,
			money: this.money,
		};
	}
}

export default Test;
