import { DS, Entity, Repository } from "fastcar-core/annotation";
import MysqlMapper from "../../../src/operation/MysqlMapper";
import Test from "../model/Test";

@Entity(Test)
@Repository
@DS("test2")
class TestMapper2 extends MysqlMapper<Test> {}

export default TestMapper2;
