import Column from "../../../src/annotation/Column";
import DataType from "../../../src/annotation/DataType";
import PrimaryKey from "../../../src/annotation/PrimaryKey";
import Table from "../../../src/annotation/Table";

@Table("test")
class Test {
	@Column("id")
	@DataType("int")
	@PrimaryKey
	id!: number;

	@Column("name")
	@DataType("varchar")
	name!: string;
}

export default Test;
