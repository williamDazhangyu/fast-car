import { annotation, FastCarApplication } from "fastcar-core";
import "reflect-metadata";

const { ENV, Controller } = annotation;

// export default function FastCarMysql(target: any) {
// 	let s = new FastCarApplication();
// }
@Controller
class Hello {}

let s = new Hello();
console.log(ENV);
console.log("ssss");
