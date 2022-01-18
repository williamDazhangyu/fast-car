import "reflect-metadata";
import { Table, DBType, PrimaryKey, Field } from "fastcar-mysql/annotation";
import { Size, NotNull } from "fastcar-core/annotation";
@Table("test")
class Test {
	@DBType("int")
	@PrimaryKey
	@Size({ maxSize: 9999999999 })
	id!: number;

	/**
	 * name
	 */
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
	caseTime!: Date;

	@DBType("tinyint")
	@NotNull
	@Size({ maxSize: 3 })
	flag: boolean = true;

	@DBType("decimal")
	@NotNull
	@Size({ maxSize: 99999999.99 })
	money: number = 1;

	constructor(...args: any[]) {
		Object.assign(this, ...args);
	}
}

export default Test;
