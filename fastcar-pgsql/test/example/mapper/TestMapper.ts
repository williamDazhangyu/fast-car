import { Repository, Entity } from "@fastcar/core/annotation";
import Test from "../model/Test";
import { PgsqlMapper } from "../../../src";

@Entity(Test)
@Repository
class TestMapper extends PgsqlMapper<Test> {}

export default TestMapper;
