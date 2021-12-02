import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import Log from "../../../src/annotation/Log";
import HelloController from "./controller/HelloController";

@Application
@ENV("TEST")
@Log() //启用默认日志注释
class APP {}

let s = new APP();

let helloController: HelloController = Reflect.get(s, "componentMap").get("HelloController");
helloController.callHello();
helloController.print();
console.log("获取到的配置--", helloController.getConfig());
