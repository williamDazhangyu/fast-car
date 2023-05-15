import "reflect-metadata";
import { Table, DBType, Field, PrimaryKey, NotNull, Size } from "@fastcar/core/annotation";

@Table("test")
class Test {
	@Field("id")
	@DBType("int")
	@PrimaryKey
	@NotNull
	id!: number;

	@Field("name")
	@DBType("varchar")
	@Size({ maxSize: 255 })
	name!: string;

	/**
	 * 案例名称
	 */
	@Field("case_name")
	@DBType("varchar")
	@Size({ maxSize: 10 })
	case_name!: string;

	@Field("flag")
	@DBType("tinyint")
	@Size({ maxSize: 3 })
	flag!: boolean;

	@Field("money")
	@DBType("decimal")
	money!: number;

	constructor(args?: Partial<Test>) {
		if (args) {
			Object.assign(this, args);
		}
	}

	toObject() {
		return {
			id: this.id,
			name: this.name,
			case_name: this.case_name,
			flag: this.flag,
			money: this.money,
		};
	}
}

export default Test;
