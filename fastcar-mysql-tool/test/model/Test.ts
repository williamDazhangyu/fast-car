import "reflect-metadata";
import { Table, DBType, PrimaryKey, MaxLength, Field, NotNull } from "fastcar-mysql/annotation";

@Table("test")
class Test {
	@DBType("int")
	@PrimaryKey
	@MaxLength(10)
	id!: number;

	/**
	 * name
	 */
	@DBType("varchar")
	@MaxLength(20)
	name: string = "";

	/**
	 * case_name
	 */
	@Field("case_name")
	@DBType("varchar")
	@NotNull
	@MaxLength(10)
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
	@MaxLength(3)
	flag: boolean = true;

	@DBType("decimal")
	@NotNull
	@MaxLength(10, 2)
	money: number = 1;
}

export default Test;
