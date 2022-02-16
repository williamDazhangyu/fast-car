import { DS, Entity, Repository } from "fastcar-core/annotation";
import Test from "../model/Test";
import MongoMapper from "../../../../src/operation/MongoMapper";

@Entity(Test)
@Repository
@DS("test2")
class Test2Mapper extends MongoMapper<Test> {}

export default Test2Mapper;
