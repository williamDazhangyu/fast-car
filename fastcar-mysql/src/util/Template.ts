import "reflect-metadata";
import Table from "../annotation/Table";
import Column from "../annotation/Column";
import DataType from "../annotation/DataType";
import PrimaryKey from "../annotation/PrimaryKey";

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
