import { Repository } from "fastcar-core/annotation";
import TemplateType from "../../../src/annotation/TemplateType";
import MysqlMapper from "../../../src/operation/MysqlMapper";
import Test from "../model/Test";

@TemplateType(Test)
@Repository
class TestMapper extends MysqlMapper<Test> {}

export default TestMapper;
