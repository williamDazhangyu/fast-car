import "reflect-metadata";
import { Table, DBType, Field, PrimaryKey, NotNull, IsSerial } from "@fastcar/core/annotation";

@Table("test_vector")
class VectorTest {
	@Field("id")
	@DBType("bigint")
	@PrimaryKey
	@NotNull
	@IsSerial
	id!: number;

	@Field("name")
	@DBType("varchar")
	name!: string;

	@Field("embedding")
	@DBType("vector(3)")
	embedding!: Float32Array | number[];

	constructor(args?: Partial<VectorTest>) {
		if (args) {
			Object.assign(this, args);
		}
	}

	toObject() {
		return {
			id: this.id,
			name: this.name,
			embedding: this.embedding,
		};
	}
}

export default VectorTest;
