import { FastCarApplication } from "fastcar-core";
import { Application, Log } from "fastcar-core/annotation";
import EnableMysql from "../../src/annotation/EnableMysql";
import SimpleService from "./service/SimpleService";

@Application
@EnableMysql //开启mysql数据库
@Log()
class APP {
	app!: FastCarApplication;
}

let s = new APP();
let service: SimpleService = s.app.getComponentByName("SimpleService");
service.query().then((res) => {
	console.log(res);
});
