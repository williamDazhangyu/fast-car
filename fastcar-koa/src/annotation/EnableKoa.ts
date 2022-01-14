import { FastCarApplication } from "fastcar-core";
import KoaApplication from "../KoaApplication";

//开启koa应用
export default function EnableKoa(target: any) {
	FastCarApplication.setSpecifyCompent(KoaApplication);
}
