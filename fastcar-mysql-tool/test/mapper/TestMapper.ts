import { Repository } from "fastcar-core/annotation";
import { Entity } from "fastcar-mysql/annotation";
import { MysqlMapper } from "fastcar-mysql";
import Test from "../model/Test";

@Entity(Test)
@Repository
class TestMapper extends MysqlMapper<Test> {}

export default TestMapper;
