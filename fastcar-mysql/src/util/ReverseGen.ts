import * as camelcase from "camelcase";
import * as prettier from "prettier";
import * as fs from "fs";
import * as path from "path";
import * as mysql from "mysql2/promise";
import { DataTypeEnum } from "../type/DataTypeEnum";

type FiledType = {
	COLUMN_NAME: string;
	DATA_TYPE: string;
	COLUMN_KEY: string;
	COLUMN_COMMENT: string;
	COLUMN_DEFAULT: string;
};

const DESCSQL = "SELECT COLUMN_NAME,DATA_TYPE, COLUMN_KEY, COLUMN_COMMENT, COLUMN_DEFAULT from information_schema.COLUMNS where table_name = ?";

//从数据库表逆向生成类
class ReverseGen {
	//根据数据库名称生成
	static formatType(dbtype: string) {
		return Reflect.get(DataTypeEnum, dbtype);
	}

	static genClass(dir: string, taleName: string, fieldInfo: FiledType[], style: prettier.Options) {
		//进行写入
		let importHead = `import "reflect-metadata";\n\n`;
		let className = camelcase(taleName);

		//第一个字母大写 类型
		className = className.charAt(0).toUpperCase() + className.substring(1);

		let body = Array.of();
		fieldInfo.forEach((field) => {
			//显示注释 类名称(不一致时必填) 类型(必填) 设计的key值如果有可填写 默认值
			let tmpFieldList = Array.of();
			let dbName = field.COLUMN_NAME;
			if (field.COLUMN_COMMENT) {
				tmpFieldList.push(`/**\n* ${field.COLUMN_COMMENT}\n*/`);
			}
			let formatName = camelcase(dbName);
			if (formatName != dbName) {
				tmpFieldList.push(`@Reflect.metadata("column", '${dbName}')`);
			}
			tmpFieldList.push(`@Reflect.metadata("type", '${field.DATA_TYPE}')`);
			if (field.COLUMN_KEY) {
				tmpFieldList.push(`@Reflect.metadata("key", '${field.COLUMN_KEY}')`);
			}
			tmpFieldList.push(`@Reflect.metadata("default", '${field.COLUMN_DEFAULT}')`);

			//这边要做一个db 至 属性名的转换
			tmpFieldList.push(`${formatName}!:${ReverseGen.formatType(field.DATA_TYPE)}`);
			body.push(tmpFieldList.join("\n"));
		});

		let content = `${importHead} class ${className} \{ ${body.join("\n\n")} \}\n export default ${className}`;
		//进行格式化
		const formatText = prettier.format(content, style);
		let fp = path.join(dir, `${className}.ts`);
		fs.writeFileSync(fp, formatText);
	}

	/***
	 * @version 1.0 根据数据库文件 逆向生成model
	 * @param tables 表名
	 * @param dbConfig 数据库配置
	 * @param style 基于prettier的格式
	 */
	static async generator(
		tables: { [key: string]: string },
		dbConfig: mysql.ConnectionOptions,
		style: prettier.Options = {
			tabWidth: 4,
			printWidth: 200,
			trailingComma: "es5",
			useTabs: true,
			parser: "typescript",
		}
	) {
		let dbres = await mysql.createConnection(dbConfig);
		for (let name in tables) {
			let res = await dbres.query(DESCSQL, [name]);
			let rows: any = res[0];
			ReverseGen.genClass(tables[name], name, rows, style);
		}
		dbres.destroy();
	}
}

ReverseGen.generator(
	{ test: __dirname },
	{
		database: "test",
		user: "root",
		password: "123456",
	}
);

export default ReverseGen;
