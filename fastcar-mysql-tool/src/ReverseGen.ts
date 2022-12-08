import * as camelcase from "camelcase";
import * as prettier from "prettier";
import * as fs from "fs";
import * as path from "path";
import * as mysql from "mysql2/promise";
import { DataTypeEnum } from "@fastcar/mysql";
import { FiledType } from "./FiledType";

const DESCSQL = "SELECT * from information_schema.COLUMNS WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ? ORDER BY ordinal_position";
const MAXBigNum = Math.pow(2, 53);

//从数据库表逆向生成类
class ReverseGenerate {
	//根据数据库名称生成
	static formatType(dbtype: string): string {
		return Reflect.get(DataTypeEnum, dbtype) || "any";
	}

	static formatClassName(name: string): string {
		let className = camelcase(name);
		return className.charAt(0).toUpperCase() + className.substring(1);
	}

	//创建文件夹
	static createDir(dir: string): void {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		let tmpStats = fs.statSync(dir);
		if (!tmpStats.isDirectory()) {
			console.error("dir is not Directory", dir);
			throw new Error("dir is not Directory" + dir);
		}
	}

	//生成model
	static genModel(taleName: string, dir: string, fieldInfo: FiledType[], style: prettier.Options): void {
		//进行写入
		let importHead = `import "reflect-metadata";\n`;
		let importCoreAnnotation: string[] = ["Table", "DBType"];
		let parseDateFlag = false;

		let className = ReverseGenerate.formatClassName(taleName);

		let body = Array.of();
		let objectKeys = "";
		fieldInfo.forEach((field) => {
			//显示注释 类名称(不一致时必填) 类型(必填) 设计的key值如果有可填写 默认值
			let tmpFieldList = Array.of();

			let dbName = field.COLUMN_NAME;
			if (field.COLUMN_COMMENT) {
				tmpFieldList.push(`/**\n* ${field.COLUMN_COMMENT}\n*/`);
			}

			let formatName = camelcase(dbName);

			//不缺省field字段
			tmpFieldList.push(`@Field('${dbName}')`);
			if (!importCoreAnnotation.includes("Field")) {
				importCoreAnnotation.push("Field");
			}

			tmpFieldList.push(`@DBType('${field.DATA_TYPE}')`);

			if (field.COLUMN_KEY) {
				tmpFieldList.push("@PrimaryKey");

				if (!importCoreAnnotation.includes("PrimaryKey")) {
					importCoreAnnotation.push("PrimaryKey");
				}
			}

			if (field.IS_NULLABLE == "NO") {
				tmpFieldList.push("@NotNull");

				if (!importCoreAnnotation.includes("NotNull")) {
					importCoreAnnotation.push("NotNull");
				}
			}

			let tsType = ReverseGenerate.formatType(field.DATA_TYPE);
			let length = field.CHARACTER_MAXIMUM_LENGTH || field.NUMERIC_PRECISION;

			if (length) {
				// if (tsType == "number") {
				// 	let num = Math.pow(10, length);

				// 	if (field.NUMERIC_SCALE) {
				// 		num = Math.pow(10, length - field.NUMERIC_SCALE);
				// 		let scaleNum = Math.pow(10, field.NUMERIC_SCALE);
				// 		num += (scaleNum - 1) / scaleNum;

				// 		//太大了 没有意义提示
				// 		if (num < MAXBigNum) {
				// 			tmpFieldList.push(`@Size({ maxSize: ${num - 1} })`);
				// 		}
				// 	}
				// } else {
				// 	tmpFieldList.push(`@Size({ maxSize: ${length} })`);
				// }

				if (tsType != "number") {
					tmpFieldList.push(`@Size({ maxSize: ${length} })`);
				}

				if (!importCoreAnnotation.includes("Size")) {
					importCoreAnnotation.push("Size");
				}
			}

			//这边要做一个db 至 属性名的转换
			//判断是否有默认值
			let tsValue = "";
			if (field.COLUMN_DEFAULT != null) {
				switch (tsType) {
					case "number": {
						tsValue = `${formatName}:${tsType}=${parseFloat(field.COLUMN_DEFAULT)};`;
						break;
					}
					case "boolean": {
						tsValue = `${formatName}:${tsType}=${!!parseInt(field.COLUMN_DEFAULT)};`;
						break;
					}
					case "Date": {
						// tsValue = `${formatName}:${tsType}=new Date('${field.COLUMN_DEFAULT}');`;
						tsValue = `${formatName}!:${tsType};`;
						break;
					}
					default: {
						tsValue = `${formatName}:${tsType}='${field.COLUMN_DEFAULT}';`;
						break;
					}
				}
			} else {
				tsValue = `${formatName}!:${tsType};`;
			}
			tmpFieldList.push(tsValue);
			body.push(tmpFieldList.join("\n"));
			if (tsType == "Date") {
				parseDateFlag = true;
				objectKeys += `${formatName}:DateUtil.toDateTime(this.${formatName}),\n`;
			} else {
				objectKeys += `${formatName}:this.${formatName},\n`;
			}
		});

		body.push(`constructor(args?: Partial<${className}>) {\nif(args) {Object.assign(this, args)};\n}`);
		body.push(`toObject() {\nreturn{\n ${objectKeys} };\n}\n`);

		//添加一个object的序列化
		if (parseDateFlag) {
			importHead += "import { DateUtil } from '@fastcar/core/utils'\n";
		}
		importHead += `import { ${importCoreAnnotation.join(",")} } from "@fastcar/core/annotation";`;

		let content = `${importHead}\n\n @Table('${taleName}')\n class ${className} \{\n ${body.join("\n\n")} \n\}\n\n export default ${className}`;
		//进行格式化
		const formatText = prettier.format(content, style);
		let fp = path.join(dir, `${className}.ts`);
		fs.writeFileSync(fp, formatText);
	}

	//生成mapper层
	static async genMapper(taleName: string, mapperDir: string, rp: string, style: prettier.Options): Promise<void> {
		let modelName = ReverseGenerate.formatClassName(taleName);
		let importHeadList = [`import \{ Repository, Entity \} from "@fastcar/core/annotation";`, `import \{ MysqlMapper \} from "@fastcar/mysql";`, `import ${modelName} from "${rp}/${modelName}";`];
		let className = `${modelName}Mapper`;
		let importHead = `${importHeadList.join("\n")}`;
		let body = `@Entity(${modelName})\n\n@Repository\n\nclass ${className} extends MysqlMapper<${modelName}> \{ \}`;
		let end = `export default ${className};`;

		let content = `${importHead}\n\n${body}\n\n${end}`;

		const formatText = prettier.format(content, style);
		let fp = path.join(mapperDir, `${className}.ts`);
		fs.writeFileSync(fp, formatText);
	}

	/***
	 * @version 1.0 根据数据库文件 逆向生成model
	 * @param tables 表名
	 * @param modelDir model类生成的绝对路径
	 * @param
	 * @param dbConfig 数据库配置
	 * @param style 基于prettier的格式
	 */
	static async generator(
		tables: string[],
		modelDir: string, //绝对路径
		mapperDir: string, //mapper绝对路径文件夹
		dbConfig: mysql.ConnectionOptions,
		style: prettier.Options = {
			tabWidth: 4,
			printWidth: 200,
			trailingComma: "es5",
			useTabs: true,
			parser: "typescript",
		}
	): Promise<void> {
		try {
			//生成路径
			ReverseGenerate.createDir(modelDir);
			ReverseGenerate.createDir(mapperDir);

			let dbres = await mysql.createConnection(dbConfig);

			//求相对路径
			let rp = path.relative(mapperDir, modelDir);
			rp = rp.replace(/\\/g, "/") || "."; //系统不一致时 分隔符替换

			for (let name of tables) {
				let res = await dbres.query(DESCSQL, [name, dbConfig.database]);
				let row: any = res[0];
				if (!row || !Array(row) || row.length == 0) {
					throw new Error("The table does not exist or is empty");
				}
				ReverseGenerate.genModel(name, modelDir, row, style);
				ReverseGenerate.genMapper(name, mapperDir, rp, style);
			}

			dbres.end();
		} catch (e) {
			console.error(e);
		}
	}
}

export default ReverseGenerate;
