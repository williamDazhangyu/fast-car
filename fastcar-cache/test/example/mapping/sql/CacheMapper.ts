import { Entity, Repository } from "fastcar-core/annotation";
import { MysqlMapper } from "fastcar-mysql";
import CacheModel from "./CacheModel";

@Entity(CacheModel)
@Repository
class CacheMapper extends MysqlMapper<CacheModel> {}

export default CacheMapper;
