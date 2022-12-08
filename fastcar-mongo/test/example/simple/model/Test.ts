import { Size, NotNull, Table, Field, DBType, PrimaryKey } from "@fastcar/core/annotation";

@Table("test")
class Test {
	@Field("id")
	@DBType("int")
	@PrimaryKey
	id!: number;

	@Field("name")
	@DBType("varchar")
	@NotNull
	@Size({ maxSize: 10 })
	name!: string;

	@Field("case_name")
	@DBType("varchar")
	@Size({ maxSize: 20 })
	caseName!: string;

	@Field("case_time")
	@DBType("datetime")
	caseTime: Date = new Date();

	@Field("flag")
	@DBType("tinyint")
	flag: boolean = true;

	@Field("money")
	@DBType("decimal")
	money: number = 1.0;

	constructor(...args: any) {
		Object.assign(this, ...args);
	}
}

export default Test;
