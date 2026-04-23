import { Repository, Entity } from "@fastcar/core/annotation";
import CrudTest from "../model/CrudTest";
import { PgsqlMapper } from "../../../src";

@Entity(CrudTest)
@Repository
class CrudTestMapper extends PgsqlMapper<CrudTest> {}

export default CrudTestMapper;
