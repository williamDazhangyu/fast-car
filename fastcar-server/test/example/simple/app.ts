import "reflect-metadata";
import { FastCarApplication } from "fastcar-core";
import { Application, BaseFilePath, BasePath } from "fastcar-core/annotation";
import EnableServer from "../../../src/EnableServer";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnableServer
class APP {
	app!: FastCarApplication;
}
new APP();
