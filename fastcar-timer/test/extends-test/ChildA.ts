import { EnableScheduling } from "../../src/Scheduling2";
import Root from "./Root";

@EnableScheduling
export default class ChildA extends Root {
	name = "A";
}
