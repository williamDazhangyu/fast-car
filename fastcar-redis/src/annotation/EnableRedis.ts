import { FastCarApplication } from "fastcar-core";
import RedisDataSourceManager from "../RedisDataSourceManager";

//开启redis插件
export default function EnableRedis(target: any) {
	FastCarApplication.setSpecifyCompent(RedisDataSourceManager);
}
