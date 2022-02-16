import { Entity, Repository } from "fastcar-core/annotation";
import MysqlMapper from "../../../src/operation/MysqlMapper";
import Test from "../model/Test";

@Entity(Test)
@Repository
class TestMapper extends MysqlMapper<Test> {}

export default TestMapper;
