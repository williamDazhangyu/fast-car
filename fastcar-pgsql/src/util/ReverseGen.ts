import * as camelcase from "camelcase";
import * as prettier from "prettier";
import * as fs from "fs";
import * as path from "path";
import { FiledType } from "../type/FiledType";
import { DataTypeEnum } from "../type/DataTypeEnum";
import * as pg from "pg";
import { DataMap } from "@fastcar/core";

const DESCSQL =
	"SELECT A.attname AS COLUMN_NAME,pgd.description AS column_comment,i.DATA_TYPE,i.COLUMN_DEFAULT,i.IS_NULLABLE,i.CHARACTER_MAXIMUM_LENGTH,i.NUMERIC_PRECISION,i.NUMERIC_SCALE " +
	" FROM pg_attribute A LEFT JOIN pg_description pgd ON A.attrelid = pgd.objoid AND A.attnum = pgd.objsubid LEFT JOIN information_schema.COLUMNS AS i ON i.COLUMN_NAME = A.attname " +
	" WHERE A.attrelid = $1 :: REGCLASS AND A.attnum > 0 AND NOT A.attisdropped AND i.TABLE_NAME = $2 ORDER BY i.ordinal_position";

const PrimarySQL =
	"SELECT col.column_name, tc.constraint_type FROM information_schema.key_column_usage col INNER JOIN information_schema.table_constraints tc " +
	" ON col.constraint_schema = tc.constraint_schema AND col.constraint_name = tc.constraint_name AND col.table_name = tc.table_name " +
	" WHERE tc.constraint_type = 'PRIMARY KEY' AND col.table_schema = 'public' AND col.table_name = $1";

//从数据库表逆向生成类
class ReverseGenerate {
	//根据数据库名称生成
	static formatType(dbtype: string): string {
		let dt = dbtype.split(" ");
		if (dt.length > 1) {
			return Reflect.get(DataTypeEnum, dt[0]) || "any";
		}

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
	static genModel({ taleName, dir, fieldInfo, style, ignoreCamelcase }: { taleName: string; dir: string; fieldInfo: FiledType[]; style: prettier.Options; ignoreCamelcase: boolean }): void {
		//进行写入
		let importHead = `import "reflect-metadata";\n`;
		let importCoreAnnotation: string[] = ["Table", "DBType"];

		let className = ReverseGenerate.formatClassName(taleName);

		let body = Array.of();
		let objectKeys = "";
		fieldInfo.forEach((field) => {
			//显示注释 类名称(不一致时必填) 类型(必填) 设计的key值如果有可填写 默认值
			let tmpFieldList = Array.of();

			let dbName = field.column_name;
			if (field.column_comment) {
				tmpFieldList.push(`/**\n* ${field.column_comment}\n*/`);
			}

			let formatName = ignoreCamelcase ? dbName : camelcase(dbName);

			//不缺省field字段
			tmpFieldList.push(`@Field('${dbName}')`);
			if (!importCoreAnnotation.includes("Field")) {
				importCoreAnnotation.push("Field");
			}

			tmpFieldList.push(`@DBType('${field.data_type}')`);

			if (field.data_type.startsWith("json")) {
				tmpFieldList.push(`@CustomType("json")`);
				if (!importCoreAnnotation.includes("CustomType")) {
					importCoreAnnotation.push("CustomType");
				}
			}

			if (field.column_key == "PRIMARY KEY") {
				tmpFieldList.push("@PrimaryKey");

				if (!importCoreAnnotation.includes("PrimaryKey")) {
					importCoreAnnotation.push("PrimaryKey");
				}
			}

			if (field.is_nullable == "NO") {
				tmpFieldList.push("@NotNull");

				if (!importCoreAnnotation.includes("NotNull")) {
					importCoreAnnotation.push("NotNull");
				}
			}

			let tsType = ReverseGenerate.formatType(field.data_type);
			let length = field.character_maximum_length || field.numeric_precision;

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
			if (field.column_default != null) {
				switch (tsType) {
					case "number": {
						let n = parseFloat(field.column_default);
						if (!isNaN(n)) {
							tsValue = `${formatName}:${tsType}=${n};`;
						} else {
							if (field.column_default.startsWith("nextval")) {
								tmpFieldList.push(`@IsSerial`);
							}
							if (!importCoreAnnotation.includes("IsSerial")) {
								importCoreAnnotation.push("IsSerial");
							}
							tsValue = `${formatName}!:${tsType};`;
						}
						break;
					}
					case "boolean": {
						tsValue = `${formatName}:${tsType}=${field.column_default};`;
						break;
					}
					case "Date": {
						// tsValue = `${formatName}:${tsType}=new Date('${field.COLUMN_DEFAULT}');`;
						tsValue = `${formatName}!:${tsType};`;
						break;
					}
					default: {
						tsValue = `${formatName}:${tsType}='${field.column_default}';`;
						break;
					}
				}
			} else {
				tsValue = `${formatName}!:${tsType};`;
			}
			tmpFieldList.push(tsValue);
			body.push(tmpFieldList.join("\n"));
			if (tsType == "Date") {
				objectKeys += `${formatName}:(this.${formatName}?.getTime()),\n`;
			} else {
				objectKeys += `${formatName}:this.${formatName},\n`;
			}
		});

		body.push(`constructor(args?: Partial<${className}>) {\nif(args) {Object.assign(this, args)};\n}`);
		body.push(`toObject() {\nreturn{\n ${objectKeys} };\n}\n`);

		importHead += `import { ${importCoreAnnotation.join(",")} } from "@fastcar/core/annotation";`;

		let content = `${importHead}\n\n @Table('${taleName}')\n class ${className} \{\n ${body.join("\n\n")} \n\}\n\n export default ${className}`;
		//进行格式化
		const formatText = prettier.format(content, style);
		let fp = path.join(dir, `${className}.ts`);
		fs.writeFileSync(fp, formatText);
	}

	//生成mapper层
	static async genMapper({ taleName, mapperDir, rp, style }: { taleName: string; mapperDir: string; rp: string; style: prettier.Options }): Promise<void> {
		let modelName = ReverseGenerate.formatClassName(taleName);
		let importHeadList = [`import \{ Repository, Entity \} from "@fastcar/core/annotation";`, `import \{ PgsqlMapper \} from "@fastcar/pgsql";`, `import ${modelName} from "${rp}/${modelName}";`];
		let className = `${modelName}Mapper`;
		let importHead = `${importHeadList.join("\n")}`;
		let body = `@Entity(${modelName})\n\n@Repository\n\nclass ${className} extends PgsqlMapper<${modelName}> \{ \}`;
		let end = `export default ${className};`;

		let content = `${importHead}\n\n${body}\n\n${end}`;

		const formatText = prettier.format(content, style);
		let fp = path.join(mapperDir, `${className}.ts`);
		fs.writeFileSync(fp, formatText);
	}

	/***
	 * @version 1.0 根据数据库文件 逆向生成model
	 * @param config
	 * tables 表名
	 * modelDir model类生成的绝对路径文件夹
	 * mapperDir mapper类生成的绝对路径文件夹
	 * dbConfig 数据库配置
	 * style 基于prettier的格式
	 */
	static async generator({
		tables,
		modelDir,
		mapperDir,
		dbConfig,
		style = {
			tabWidth: 4,
			printWidth: 200,
			trailingComma: "es5",
			useTabs: true,
			parser: "typescript",
		},
		ignoreCamelcase = false,
	}: {
		tables: string[];
		modelDir: string; //绝对路径
		mapperDir: string; //mapper绝对路径文件夹
		dbConfig: pg.PoolConfig;
		style?: prettier.Options;
		ignoreCamelcase?: boolean;
	}): Promise<void> {
		try {
			if (tables.length == 0) {
				throw new Error("table is empty");
			}

			//生成路径
			ReverseGenerate.createDir(modelDir);
			ReverseGenerate.createDir(mapperDir);

			let dbres = new pg.Client(dbConfig);
			await dbres.connect();

			//求相对路径
			let rp = path.relative(mapperDir, modelDir);
			rp = rp.replace(/\\/g, "/") || "."; //系统不一致时 分隔符替换

			for (let name of tables) {
				let res: pg.QueryResult<FiledType> = await dbres.query(DESCSQL, [name, name]);
				let pres: pg.QueryResult<{
					column_name: string;
					constraint_type: string;
				}> = await dbres.query(PrimarySQL, [name]);

				let dmap = new DataMap<string, string>();
				pres.rows.forEach((r) => {
					dmap.set(r.column_name, r.constraint_type);
				});

				res.rows = res.rows.map((r) => {
					r.column_key = dmap.get(r.column_name) || "";
					return r;
				});

				ReverseGenerate.genModel({ taleName: name, dir: modelDir, fieldInfo: res.rows, style, ignoreCamelcase });
				ReverseGenerate.genMapper({ taleName: name, mapperDir, rp, style });
			}

			dbres.end();
		} catch (e) {
			console.error(e);
		}
	}
}

export default ReverseGenerate;
