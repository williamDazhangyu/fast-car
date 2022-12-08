import { Application } from "@fastcar/core/annotation";
import { FastCarApplication } from "@fastcar/core";
import CrudService from "./service/CrudService";
import EnableMongo from "../../../src/annotation/EnableMongo";
import DSService from "./service/DSService";

@Application
@EnableMongo
class APP {
	app!: FastCarApplication;

	async startServer() {
		let crudService: CrudService = this.app.getComponentByTarget(CrudService);

		let saveRes = await crudService.save();
		console.log("saveone---", saveRes);

		let saveListRes = await crudService.saveList();
		console.log("saveList---", saveListRes);

		let updateRes = await crudService.update();
		console.log("update---", updateRes);

		let updateOneRes = await crudService.updateOne();
		console.log("updateOne---", updateOneRes);

		let updateByPrimaryKeyRes = await crudService.updateByPrimaryKey();
		console.log("updateByPrimaryKey---", updateByPrimaryKeyRes);

		let selectRes = await crudService.select();
		console.log("select---", selectRes);

		let selectOneRes = await crudService.selectOne();
		console.log("selectOne---", selectOneRes);

		let selectByPrimaryKeyRes = await crudService.selectByPrimaryKey();
		console.log("selectByPrimaryKey---", selectByPrimaryKeyRes);

		let existRes = await crudService.exist();
		console.log("exist", existRes);

		let count = await crudService.count();
		console.log("count---", count);

		let deleteRes = await crudService.delete();
		console.log("delete---", deleteRes);

		let deleteOneRes = await crudService.deleteOne();
		console.log("deletOne---", deleteOneRes);

		let deleteByPrimaryKeyRes = await crudService.deleteByPrimaryKey();
		console.log("deleteByPrimaryKey---", deleteByPrimaryKeyRes);

		let dsService: DSService = this.app.getComponentByTarget(DSService);
		dsService.switchDS();
	}
}

export default new APP();
