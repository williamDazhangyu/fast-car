import { Repository, Entity, DS } from "@fastcar/core/annotation";
import Test from "../model/Test";
import PgsqlMapper from "../../../src/operation/PgsqlMapper";

@DS("test2")
@Entity(Test)
@Repository
class Test2Mapper extends PgsqlMapper<Test> {}

export default Test2Mapper;
