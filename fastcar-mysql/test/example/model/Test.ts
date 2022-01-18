import Field from "../../../src/annotation/mapper/Field";
import DBType from "../../../src/annotation/mapper/DBType";
import PrimaryKey from "../../../src/annotation/mapper/PrimaryKey";
import Table from "../../../src/annotation/Table";
import { Size, NotNull } from "fastcar-core/annotation";
import "reflect-metadata";

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
	caseTime!: Date;

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
