import { MongoClient, Db } from "mongodb";
import { SqlConfig } from "../type/SqlConfig";

class MongoDataSource {
	_pool!: MongoClient;

	//这边做一个约定 连接时必须保证连上了一个可用的数据库
	async createClient({ url, opts = {} }: SqlConfig): Promise<void> {
		this._pool = await MongoClient.connect(url, opts);
	}

	//关于连接的操作
	getConnection(): Db {
		return this._pool.db();
	}

	//关闭连接池
	async close(): Promise<void> {
		await this._pool.close();
	}

	getPool(): MongoClient {
		return this._pool;
	}
}

export default MongoDataSource;
