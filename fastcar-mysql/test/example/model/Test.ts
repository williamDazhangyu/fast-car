import Field from "../../../src/annotation/mapper/Field";
import DBType from "../../../src/annotation/mapper/DBType";
import PrimaryKey from "../../../src/annotation/mapper/PrimaryKey";
import Table from "../../../src/annotation/Table";
import MaxLength from "../../../src/annotation/mapper/MaxLength";
import NotNull from "../../../src/annotation/mapper/NotNull";
import "reflect-metadata";

@Table("test")
class Test {
	@Field("id")
	@DBType("int")
	@PrimaryKey
	id!: number;

	@Field("name")
	@DBType("varchar")
	@MaxLength(10)
	@NotNull
	name!: string;

	@Field("case_name")
	@DBType("varchar")
	@MaxLength(20)
	caseName!: string;

	@Field("case_time")
	@DBType("datetime")
	caseTime!: Date;

	@Field("flag")
	@DBType("tinyint")
	flag!: boolean;

	@Field("money")
	@DBType("decimal")
	money!: number;
}

export default Test;
