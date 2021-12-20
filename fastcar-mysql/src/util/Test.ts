import "reflect-metadata";
import DOInterface from "../interface/DOInterface";

// @Reflect.metadata("table", "test")
class Test {
	@Reflect.metadata("type", "int")
	@Reflect.metadata("key", "PRI")
	@Reflect.metadata("default", "null")
	id!: number;

	/**
	 * name
	 */
	@Reflect.metadata("type", "varchar")
	@Reflect.metadata("default", "")
	name!: string;

	/**
	 * case_name
	 */
	@Reflect.metadata("column", "case_name")
	@Reflect.metadata("type", "varchar")
	@Reflect.metadata("default", "haha")
	caseName!: string;

	/**
	 * 案例时间
	 */
	@Reflect.metadata("column", "case_time")
	@Reflect.metadata("type", "year")
	@Reflect.metadata("default", "null")
	caseTime!: string;

	getTableName(): string {
		return Reflect.getMetadata("table", this);
	}

	toDB() {
		return {
			name: this.name,
			id: this.id,
			case_name: this.caseName,
			case_time: this.caseTime,
		};
	}
}

Reflect.defineMetadata("table", "test", Test.prototype);

console.log(Reflect.getMetadata("table", Test.prototype));
console.log(Reflect.getMetadata("type", Test.prototype, "id"));

let s = Object.create(Test.prototype);

console.log(s instanceof Test);

export default Test;
