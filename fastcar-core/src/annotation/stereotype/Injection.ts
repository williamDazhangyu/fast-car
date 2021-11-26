import "reflect-metadata";
import FastCarApplication from "../../service/FastCarApplication";

export default function Injection(target: any, name: string) {
	Reflect.defineMetadata(name, true, target.prototype);
	FastCarApplication.setInjectionMap(target.name);
}
