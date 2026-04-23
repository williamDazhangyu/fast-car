import { Repository, Entity } from "@fastcar/core/annotation";
import VectorTest from "../model/VectorTest";
import { PgsqlMapper } from "../../../src";

@Entity(VectorTest)
@Repository
class VectorTestMapper extends PgsqlMapper<VectorTest> {}

export default VectorTestMapper;
