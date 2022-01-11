"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const camelcase = require("camelcase");
const prettier = require("prettier");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const fastcar_mysql_1 = require("fastcar-mysql");
const DESCSQL = "SELECT * from information_schema.COLUMNS where table_name = ?";
//从数据库表逆向生成类
class ReverseGenerate {
    //根据数据库名称生成
    static formatType(dbtype) {
        return Reflect.get(fastcar_mysql_1.DataTypeEnum, dbtype);
    }
    static formatClassName(name) {
        let className = camelcase(name);
        return className.charAt(0).toUpperCase() + className.substring(1);
    }
    //创建文件夹
    static createDir(dir) {
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
    static genModel(taleName, dir, fieldInfo, style) {
        //进行写入
        let importHead = `import "reflect-metadata";\n`;
        let importAnnotation = ["Table", "DBType"];
        let className = ReverseGenerate.formatClassName(taleName);
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
                tmpFieldList.push(`@Field('${dbName}')`);
                if (!importAnnotation.includes("Field")) {
                    importAnnotation.push("Field");
                }
            }
            tmpFieldList.push(`@DBType('${field.DATA_TYPE}')`);
            if (field.COLUMN_KEY) {
                tmpFieldList.push("@PrimaryKey");
                if (!importAnnotation.includes("PrimaryKey")) {
                    importAnnotation.push("PrimaryKey");
                }
            }
            if (field.IS_NULLABLE == "YES") {
                tmpFieldList.push("@NotNull");
                if (!importAnnotation.includes("NotNull")) {
                    importAnnotation.push("NotNull");
                }
            }
            let length = field.CHARACTER_MAXIMUM_LENGTH || field.NUMERIC_PRECISION;
            if (length) {
                if (field.NUMERIC_SCALE) {
                    tmpFieldList.push(`@MaxLength(${length},${field.NUMERIC_SCALE})`);
                }
                else {
                    tmpFieldList.push(`@MaxLength(${length})`);
                }
                if (!importAnnotation.includes("MaxLength")) {
                    importAnnotation.push("MaxLength");
                }
            }
            //这边要做一个db 至 属性名的转换
            //判断是否有默认值
            let tsType = ReverseGenerate.formatType(field.DATA_TYPE);
            let tsValue = "";
            if (field.COLUMN_DEFAULT != null) {
                switch (tsType) {
                    case "number": {
                        tsValue = `${formatName}:${tsType}=${parseFloat(field.COLUMN_DEFAULT)};`;
                        break;
                    }
                    case "boolean": {
                        tsValue = `${formatName}:${tsType}=${!!field.COLUMN_DEFAULT};`;
                        break;
                    }
                    default: {
                        tsValue = `${formatName}:${tsType}='${field.COLUMN_DEFAULT}';`;
                        break;
                    }
                }
            }
            else {
                tsValue = `${formatName}!:${tsType};`;
            }
            tmpFieldList.push(tsValue);
            body.push(tmpFieldList.join("\n"));
        });
        //补全导入的头
        importHead += `import { ${importAnnotation.join(",")} } from "fastcar-mysql/annotation";\n`;
        let content = `${importHead}\n @Table('${taleName}')\n class ${className} \{\n ${body.join("\n\n")} \n\}\n\n export default ${className}`;
        //进行格式化
        const formatText = prettier.format(content, style);
        let fp = path.join(dir, `${className}.ts`);
        fs.writeFileSync(fp, formatText);
    }
    //生成mapper层
    static async genMapper(taleName, mapperDir, rp, style) {
        let modelName = ReverseGenerate.formatClassName(taleName);
        let importHeadList = [
            `import \{ Repository \} from "fastcar-core/annotation";`,
            `import \{ Entity \} from "fastcar-mysql/annotation";`,
            `import \{ MysqlMapper \} from "fastcar-mysql";`,
            `import ${modelName} from "${rp}/${modelName}";`,
        ];
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
    static async generator(tables, modelDir, //绝对路径
    mapperDir, //mapper绝对路径文件夹
    dbConfig, style = {
        tabWidth: 4,
        printWidth: 200,
        trailingComma: "es5",
        useTabs: true,
        parser: "typescript",
    }) {
        //生成路径
        ReverseGenerate.createDir(modelDir);
        ReverseGenerate.createDir(mapperDir);
        let dbres = await mysql.createConnection(dbConfig);
        //求相对路径
        let rp = path.relative(mapperDir, modelDir);
        for (let name of tables) {
            let res = await dbres.query(DESCSQL, [name]);
            let row = res[0];
            ReverseGenerate.genModel(name, modelDir, row, style);
            ReverseGenerate.genMapper(name, mapperDir, rp, style);
        }
        dbres.destroy();
    }
}
exports.default = ReverseGenerate;