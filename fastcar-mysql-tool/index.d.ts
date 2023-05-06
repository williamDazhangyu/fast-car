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
	static genModel(taleName: string, dir: string, fieldInfo: FiledType[], style: prettier.Options, ignoreCamelcase: boolean): void;

	//生成mapper层
	static genMapper(taleName: string, mapperDir: string, rp: string, style: prettier.Options, ignoreCamelcase: boolean): Promise<void>;

	/***
	 * @version 1.0 根据数据库文件 逆向生成model
	 * @param tables 表名
	 * @param modelDir model类生成的绝对路径文件夹
	 * @param mapperDir mapper类生成的绝对路径文件夹
	 * @param dbConfig 数据库配置
	 * @param style 基于prettier的格式
	 */
	static generator(tables: string[], modelDir: string, mapperDir: string, dbConfig: mysql.ConnectionOptions, style?: prettier.Options, ignoreCamelcase?: boolean): Promise<void>;
}
