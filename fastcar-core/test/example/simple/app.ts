import Application from "../../../src/annotation/Application";
import { ENV } from "../../../src/annotation/env/ENV";
import FastCarApplication from "../../../src/service/FastCarApplication";
import HelloController from "./controller/HelloController";

@Application
@ENV("TEST")
class APP {}

let s = new APP();

let helloController: HelloController = Reflect.get(s, "componentMap").get("HelloController");
helloController.callHello();
