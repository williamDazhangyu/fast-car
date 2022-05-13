import path = require("path");
import CacheMapping from "../../../src/annotation/CacheMapping";
import { CacheConfig } from "../../../src/CacheType";
import DBClientService from "../../../src/dbclient/DBClientService";
import FSClient from "../../../src/dbclient/FSClient";

@CacheMapping
export default class FileClientMapping implements CacheConfig {
	store: string = "fileStore";
	initSync: boolean = true;
	syncTimer: number = 5; //5秒钟同步一次
	dbClient: DBClientService;

	constructor() {
		this.dbClient = new FSClient(path.join(__dirname, "../", "filedb", "filedb.json"));
	}
}
