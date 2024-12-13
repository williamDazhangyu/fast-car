export type ProtoMeta = {
	protoPath: string;
	service: string; //服务
};

export type ProtoBindUrl = {
	url: string; //忽略大小写
	method: string; //方法
};

export type PBConfig = ProtoMeta & ProtoBindUrl;

export type ProtoList = {
	root: ProtoMeta;
	list?: ProtoBindUrl[];
	prefixUrl?: string;
};

export type ProtoRoot = {
	protoPath: string;
	root: any; //import { Root } from "protobufjs";
};
