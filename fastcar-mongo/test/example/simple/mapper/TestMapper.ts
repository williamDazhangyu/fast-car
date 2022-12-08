import { Entity, Repository } from "@fastcar/core/annotation";
import Test from "../model/Test";
import MongoMapper from "../../../../src/operation/MongoMapper";

@Entity(Test)
@Repository
class TestMapper extends MongoMapper<Test> {}

export default TestMapper;
