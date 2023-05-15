import * as prettier from "prettier";
import * as mysql from "mysql2/promise";
import { FiledType } from "./src/FiledType";

export class ReverseGenerate {
	//根据数据库名称生成
	static formatType(dbtype: string): string;

	static formatClassName(name: string): string;

	//创建文件夹
	static createDir(dir: string): void;

	//生成model
	static genModel(modelConfig: { taleName: string; dir: string; fieldInfo: FiledType[]; style: prettier.Options; ignoreCamelcase: boolean }): void;

	//生成mapper层
	static genMapper(mapperConfig: { taleName: string; mapperDir: string; rp: string; style: prettier.Options }): Promise<void>;

	/***
	 * @version 1.0 根据数据库文件 逆向生成model
	 * @param config
	 * tables 表名
	 * modelDir model类生成的绝对路径文件夹
	 * mapperDir mapper类生成的绝对路径文件夹
	 * dbConfig 数据库配置
	 * style 基于prettier的格式
	 */
	static generator(config: {
		tables: string[];
		modelDir: string; //绝对路径
		mapperDir: string; //mapper绝对路径文件夹
		dbConfig: mysql.ConnectionOptions;
		style?: prettier.Options;
		ignoreCamelcase?: boolean;
	}): Promise<void>;
}
