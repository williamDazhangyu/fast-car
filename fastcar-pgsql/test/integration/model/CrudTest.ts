import "reflect-metadata";
import { Table, DBType, Field, PrimaryKey, NotNull, IsSerial } from "@fastcar/core/annotation";

@Table("test_crud")
class CrudTest {
	@Field("id")
	@DBType("bigint")
	@PrimaryKey
	@NotNull
	@IsSerial
	id!: number;

	@Field("name")
	@DBType("varchar")
	name!: string;

	@Field("value")
	@DBType("integer")
	value!: number;

	@Field("created_at")
	@DBType("timestamp")
	createdAt!: Date;

	constructor(args?: Partial<CrudTest>) {
		if (args) {
			Object.assign(this, args);
		}
	}

	toObject() {
		return {
			id: this.id,
			name: this.name,
			value: this.value,
			createdAt: this.createdAt?.getTime(),
		};
	}
}

export default CrudTest;
