"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../type/DesignMeta");
const annotation_1 = require("fastcar-core/annotation");
const MysqlDataSourceManager_1 = require("../dataSource/MysqlDataSourceManager");
const OperationType_1 = require("./OperationType");
const utils_1 = require("fastcar-core/utils");
const SerializeUtil_1 = require("../util/SerializeUtil");
const SqlError_1 = require("../type/SqlError");
const SqlSession_1 = require("../annotation/SqlSession");
const DSInjection_1 = require("../annotation/DSInjection");
const index_1 = require("../../../fastcar-core/index");
/****
 * @version 1.0 采用crud方式进行数据操作
 */
class MysqlMapper {
    constructor() {
        let tClass = Reflect.getMetadata(DesignMeta_1.DesignMeta.entity, this);
        this.classZ = tClass;
        let tableName = Reflect.getMetadata(DesignMeta_1.DesignMeta.table, tClass);
        if (!tableName) {
            throw new Error(`This class ${tClass.name} has no annotation table name`);
        }
        this.tableName = tableName;
        this.mappingMap = Reflect.getMetadata(DesignMeta_1.DesignMeta.mapping, tClass); //映射关系
        this.dbFields = Reflect.getMetadata(DesignMeta_1.DesignMeta.dbFields, tClass); //作用的列名
        this.mappingList = Array.of();
        this.mappingMap.forEach((item) => {
            this.mappingList.push(item);
        });
    }
    //获取数据库别名通过代码内的名称
    getFieldName(name) {
        let info = this.mappingMap.get(name);
        return info ? info.field : name;
    }
    //自动映射数据库字段
    toDBValue(v, key, type) {
        let value = Reflect.get(v, key);
        let tmpValue = SerializeUtil_1.default.serialize(value, type);
        return tmpValue;
    }
    //分析选定字段
    analysisFields(fields = []) {
        if (fields.length == 0) {
            return "*";
        }
        let list = fields.map((item) => {
            return this.getFieldName(item);
        });
        return list.join(",");
    }
    //解析条件
    analysisWhere(where = {}) {
        let keys = Reflect.ownKeys(where);
        let maxLength = keys.length;
        if (maxLength <= 0) {
            return {
                str: "",
                args: [],
            };
        }
        let str = "WHERE ";
        let cList = [];
        let params = [];
        keys.forEach((i, index) => {
            let key = i.toString();
            let alias = this.getFieldName(key);
            let item = where[key];
            let tmpStr = "";
            //这边进行一个类型推断
            let outerJoin = "AND";
            let typeStr = typeof item;
            if (typeStr != "object" || !Reflect.has(item, "value")) {
                if (item == null) {
                    tmpStr = `ISNULL(${alias})`;
                }
                else if (Array.isArray(item)) {
                    tmpStr = `${alias} IN (?)`;
                    params.push(item);
                }
                else {
                    tmpStr = `${alias} = ?`;
                    params.push(item);
                }
            }
            else {
                if (!item.operator) {
                    item.operator = Array.isArray(item.value) ? OperationType_1.OperatorEnum.in : OperationType_1.OperatorEnum.eq;
                }
                //规避sql注入 统一使用?做处理
                switch (item.operator) {
                    case OperationType_1.OperatorEnum.isNUll: {
                        tmpStr = `ISNULL(${alias})`;
                        break;
                    }
                    case OperationType_1.OperatorEnum.isNotNull: {
                        tmpStr = `${alias} IS NOT NULL`;
                        break;
                    }
                    default: {
                        tmpStr = `${alias} ${item.operator} ?`;
                        params.push(item.value);
                        break;
                    }
                }
                if (item?.operator) {
                    outerJoin = item?.operator;
                }
            }
            if (index < maxLength - 1 && tmpStr) {
                tmpStr += `${outerJoin}`;
            }
            cList.push(tmpStr);
        });
        str += cList.join(" ");
        return {
            str: str,
            args: params,
        };
    }
    analysisGroups(groups = {}) {
        let keys = Object.keys(groups);
        if (keys.length > 0) {
            let list = [];
            keys.forEach((i) => {
                let key = i.toString();
                let alias = this.getFieldName(key);
                list.push(`${alias} ${groups[key]}`);
            });
            return `GROUP BY ${list.join(",")}`;
        }
        return "";
    }
    analysisOrders(orders = {}) {
        let keys = Object.keys(orders);
        if (keys.length > 0) {
            let list = [];
            keys.forEach((i) => {
                let key = i.toString();
                let alias = this.getFieldName(key);
                list.push(`${alias} ${orders[key]}`);
            });
            return `ORDER BY ${list.join(",")}`;
        }
        return "";
    }
    analysisRow(row) {
        let str = [];
        let args = Object.keys(row).map((key) => {
            let alias = this.getFieldName(key);
            str.push(`${alias} = ?`);
            return Reflect.get(row, key);
        });
        return {
            args: args,
            str: str.join(", "),
        };
    }
    analysisLimit(limit, offest) {
        if (typeof limit != "number" || limit < 0) {
            return "";
        }
        let str = `LIMIT ${limit} `;
        if (typeof offest == "number" && offest > 0) {
            str = `LIMIT ${limit}, ${offest} `;
        }
        return str;
    }
    setRow(rowData) {
        let t = new this.classZ();
        this.mappingMap.forEach((item, key) => {
            let value = Reflect.get(rowData, item.field) || Reflect.get(rowData, key);
            if (value != null) {
                let fvalue = utils_1.DataFormat.formatValue(value, item.type);
                Reflect.set(t, key, fvalue);
            }
        });
        return t;
    }
    setRows(rowDataList) {
        let list = Array.of();
        rowDataList.forEach((item) => {
            list.push(this.setRow(item));
        });
        return list;
    }
    //获取默认数据源 这边可以自行拓展
    getDataSource(service = "", read = true) {
        if (service) {
            let fnDefaultDS = Reflect.getMetadata(index_1.FastCarMetaData.DS, service);
            if (fnDefaultDS) {
                return fnDefaultDS;
            }
        }
        let classDefaultDS = Reflect.getMetadata(index_1.FastCarMetaData.DS, this);
        if (classDefaultDS) {
            return classDefaultDS;
        }
        return this.dsm.getDefaultSoucre(read);
    }
    /***
     * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
     */
    async saveORUpdate(rows, sessionId, ds) {
        if (!Array.isArray(rows)) {
            rows = [rows];
        }
        if (rows.length == 0) {
            return Promise.reject(new Error(`rows is empty by ${this.tableName} saveORUpdate`));
        }
        let afterKeys = Array.of();
        let beforeKeys = Array.of();
        this.mappingList.forEach((item) => {
            beforeKeys.push(item.field);
            if (!item.primaryKey) {
                afterKeys.push(`${item.field} = VALUES (${item.field})`);
            }
        });
        let args = [];
        let values = [];
        let paramsSymbol = new Array(beforeKeys.length).fill("?");
        for (let row of rows) {
            for (let item of this.mappingList) {
                let dbValue = this.toDBValue(row, item.name, item.type);
                if (utils_1.ValidationUtil.isNull(dbValue)) {
                    if (item.notNull) {
                        return Promise.reject(new SqlError_1.default(`${item.name} value is null`));
                    }
                }
                args.push(dbValue);
            }
            values.push(`(${paramsSymbol.join(",")})`);
        }
        let valueStr = values.join(",");
        let afterKeyStr = afterKeys.join(",");
        let sql = `INSERT INTO ${this.tableName} (${beforeKeys.join(",")}) VALUES ${valueStr} ON DUPLICATE KEY UPDATE ${afterKeyStr}`;
        let [okPacket] = await this.dsm.exec({ sql, args, ds, sessionId });
        return okPacket.insertId;
    }
    /***
     * @version 1.0 插入单条记录返回主键
     */
    async saveOne(row, sessionId, ds) {
        let params = [];
        let args = [];
        for (let item of this.mappingList) {
            let dbValue = this.toDBValue(row, item.name, item.type);
            if (utils_1.ValidationUtil.isNotNull(dbValue)) {
                params.push(item.field);
                args.push(dbValue);
            }
            else {
                if (item.notNull) {
                    return Promise.reject(new SqlError_1.default(`${item.name} value is null`));
                }
            }
        }
        let paramsSymbol = new Array(params.length).fill("?").join(",");
        let sql = `INSERT INTO ${this.tableName} (${params.join(",")}) VALUES (${paramsSymbol})`;
        let [res] = await this.dsm.exec({ sql, args, ds, sessionId });
        return res.insertId;
    }
    /***
     * @version 1.0 批量插入记录
     */
    async saveList(rows, sessionId, ds) {
        if (rows.length < 1) {
            return Promise.reject(new Error("rows is empty"));
        }
        let keys = Array.of();
        this.mappingList.forEach((item) => {
            keys.push(item.field);
        });
        let keysStr = keys.join(",");
        let sql = `INSERT INTO ${this.tableName} (${keysStr}) VALUES `;
        let paramsStr = new Array(keys.length).fill("?").join(",");
        for (let i = 0; i < rows.length;) {
            let paramsList = [];
            let tpmList = rows.slice(0, 1000);
            let args = [];
            tpmList.forEach((row) => {
                this.mappingList.forEach((item) => {
                    args.push(this.toDBValue(row, item.name, item.type));
                });
                paramsList.push(`(${paramsStr})`);
            });
            i += tpmList.length;
            let tmpSQL = sql + paramsList.join(",");
            await this.dsm.exec({ sql: tmpSQL, args, ds, sessionId });
        }
        return true;
    }
    /***
     * @version 1.0 更新记录
     *
     */
    async update({ row, where, limit }, sessionId, ds) {
        let rowStr = this.analysisRow(row);
        if (!rowStr) {
            return Promise.reject(new Error("row is empty"));
        }
        let whereC = this.analysisWhere(where);
        let limitStr = this.analysisLimit(limit);
        let sql = `UPDATE ${this.tableName} SET ${rowStr.str} ${whereC.str} ${limitStr}`;
        let [okPacket] = await this.dsm.exec({ sql, args: [...rowStr.args, ...whereC.args], ds, sessionId });
        let affectedRows = okPacket.affectedRows;
        let changedRows = okPacket.changedRows;
        return affectedRows > 0 && changedRows > 0;
    }
    /****
     * @version 1.0 更新一条数据
     *
     */
    async updateOne(sqlUpdate, sessionId, ds) {
        return await this.update(Object.assign({}, sqlUpdate, { limit: 1 }), sessionId, ds);
    }
    /***
     * @version 1.0 根据实体类的主键来更新数据
     *
     */
    async updateByPrimaryKey(row, sessionId, ds) {
        let sqlUpdate = {
            where: {},
            row: {},
            limit: 1,
        };
        sqlUpdate.where = {};
        for (let item of this.mappingList) {
            let dbValue = this.toDBValue(row, item.name, item.type);
            if (utils_1.ValidationUtil.isNotNull(dbValue)) {
                if (item.primaryKey) {
                    Reflect.set(sqlUpdate.where, item.field, dbValue);
                }
                else {
                    Reflect.set(sqlUpdate.row, item.field, dbValue);
                }
            }
        }
        if (Object.keys(sqlUpdate.where).length == 0) {
            return Promise.reject(new Error(`${this.tableName} primary key  is null`));
        }
        return await this.updateOne(sqlUpdate, sessionId, ds);
    }
    /***
     * @version 1.0 根据条件进行查找
     */
    async select(conditions, sessionId, ds) {
        let fields = this.analysisFields(conditions.fields);
        let whereC = this.analysisWhere(conditions.where);
        let groupStr = this.analysisGroups(conditions.groups);
        let orderStr = this.analysisOrders(conditions.orders);
        let limitStr = this.analysisLimit(conditions?.limit, conditions?.offest);
        let args = whereC.args;
        let sql = `SELECT ${fields} FROM ${this.tableName} ${whereC.str} ${groupStr} ${orderStr} ${limitStr}`;
        let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });
        if (!Array.isArray(rows)) {
            return [];
        }
        return this.setRows(rows);
    }
    /***
     * @version 1.0 查询单个对象
     *
     */
    async selectOne(conditions, sessionId, ds) {
        let queryInfo = Object.assign({}, conditions, { limit: 1 });
        let res = await this.select(queryInfo, sessionId, ds);
        let o = res.length > 0 ? res[0] : null;
        return o;
    }
    /***
     * @version 1.0 通过主键查找对象
     *
     */
    async selectByPrimaryKey(row, sessionId, ds) {
        let sqlQuery = {
            where: {},
            limit: 1,
        };
        sqlQuery.where = {};
        for (let item of this.mappingList) {
            let dbValue = this.toDBValue(row, item.name, item.type);
            if (utils_1.ValidationUtil.isNotNull(dbValue)) {
                if (item.primaryKey) {
                    Reflect.set(sqlQuery.where, item.field, dbValue);
                }
            }
        }
        if (Object.keys(sqlQuery.where).length == 0) {
            return Promise.reject(new Error(`${this.tableName} primary key  is null`));
        }
        return await this.selectOne(sqlQuery, sessionId, ds);
    }
    /***
     * @version 1.0 判定是否存在
     *
     */
    async exist(where, sessionId, ds) {
        let whereC = this.analysisWhere(where);
        let args = whereC.args;
        let sql = `SELECT 1 FROM ${this.tableName} ${whereC.str} LIMIT 1`;
        let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });
        return rows.length > 0;
    }
    /***
     * @version 1.0 统计符合条件的记录
     */
    async count(where, sessionId, ds) {
        let whereC = this.analysisWhere(where);
        let args = whereC.args;
        let sql = `SELECT COUNT(1) as num FROM ${this.tableName} ${whereC.str}`;
        let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });
        return rows[0].num;
    }
    /***
     * @version 1.0 按照条件删除记录
     */
    async delete(conditions, sessionId, ds) {
        let whereC = this.analysisWhere(conditions.where);
        let limitStr = this.analysisLimit(conditions.limit);
        let sql = `DELETE FROM ${this.tableName} ${whereC.str} ${limitStr}`;
        let [okPacket] = await this.dsm.exec({ sql, args: whereC.args, ds, sessionId });
        let affectedRows = okPacket.affectedRows;
        return affectedRows > 0;
    }
    /***
     * @version 1.0 删除某条记录
     */
    async deleteOne(where, sessionId, ds) {
        return await this.delete({
            where,
            limit: 1,
        }, sessionId, ds);
    }
    /***
     * @version 1.0 自定义sql执行
     */
    async execute(sql, args = [], sessionId, ds) {
        let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });
        return rows;
    }
}
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", MysqlDataSourceManager_1.default)
], MysqlMapper.prototype, "dsm", void 0);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "saveORUpdate", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "saveOne", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "saveList", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "update", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "updateOne", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "updateByPrimaryKey", null);
__decorate([
    DSInjection_1.default(),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "select", null);
__decorate([
    DSInjection_1.default(),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "selectOne", null);
__decorate([
    DSInjection_1.default(),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "selectByPrimaryKey", null);
__decorate([
    DSInjection_1.default(),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "exist", null);
__decorate([
    DSInjection_1.default(),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "count", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "delete", null);
__decorate([
    DSInjection_1.default(false),
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "deleteOne", null);
__decorate([
    DSInjection_1.default(),
    __param(2, SqlSession_1.default), __param(3, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "execute", null);
exports.default = MysqlMapper;
