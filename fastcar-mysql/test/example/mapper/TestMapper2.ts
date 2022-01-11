import { DS, Repository } from "fastcar-core/annotation";
import Entity from "../../../src/annotation/Entity";
import MysqlMapper from "../../../src/operation/MysqlMapper";
import Test from "../model/Test";

@Entity(Test)
@Repository
@DS("test2")
class TestMapper2 extends MysqlMapper<Test> {}

export default TestMapper2;
