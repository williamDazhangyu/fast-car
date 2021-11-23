
import "reflect-metadata";
import FastCarApplication from "../../service/FastCarApplication";

export default function SetInstanceKind(target: any, name: string) {

    Reflect.defineMetadata(name, name, target.prototype);
    //加载组件模块
    FastCarApplication.setLoadModuleMap(target.name);
}