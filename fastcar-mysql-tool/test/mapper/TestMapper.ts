import { Repository, Entity } from "fastcar-core/annotation";
import { MysqlMapper } from "fastcar-mysql";
import Test from "../model/Test";

@Entity(Test)
@Repository
class TestMapper extends MysqlMapper<Test> {}

export default TestMapper;
