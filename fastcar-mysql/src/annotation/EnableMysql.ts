import MysqlDataSourceManager from "../dataSource/MysqlDataSourceManager";
import { FastCarApplication } from "fastcar-core";

//开启数据库功能
export default function EnableMysql(target: any) {
	//手动注入实例
	FastCarApplication.setSpecifyCompent(MysqlDataSourceManager);
}
