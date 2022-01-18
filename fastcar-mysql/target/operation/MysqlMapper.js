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
const OperationType_2 = require("./OperationType");
const utils_1 = require("fastcar-core/utils");
const SerializeUtil_1 = require("../util/SerializeUtil");
const SqlSession_1 = require("../annotation/SqlSession");
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
    analysisWhere(where = {}, joinKey = "AND", params = []) {
        let finalResult = this.analysisCondition(where, joinKey, params);
        if (finalResult.sql) {
            finalResult.sql = "WHERE " + finalResult.sql;
            return finalResult;
        }
        return finalResult;
    }
    //解析条件
    analysisCondition(where = {}, joinKey = "AND", params = []) {
        let keys = Object.keys(where);
        let list = Array.of();
        if (keys.length == 0) {
            return {
                sql: "",
                args: [],
            };
        }
        for (let key of keys) {
            let value = where[key];
            if (OperationType_1.JoinKeys.includes(key)) {
                //递归调用计算
                let childResult = this.analysisCondition(value, key);
                list.push(childResult.sql);
                params = [...params, ...childResult.args];
            }
            else {
                let ov = {};
                //对缺省类型进行补充
                if (utils_1.TypeUtil.isArray(value)) {
                    //数组类型
                    Reflect.set(ov, OperationType_2.OperatorEnum.in, value);
                }
                else if (utils_1.ValidationUtil.isNull(value)) {
                    //空值类型
                    Reflect.set(ov, OperationType_2.OperatorEnum.isNUll, value);
                }
                else if (!utils_1.TypeUtil.isObject(value)) {
                    //基本类型
                    Reflect.set(ov, OperationType_2.OperatorEnum.eq, value);
                }
                else {
                    ov = value;
                }
                //聚合类型
                let clist = Array.of();
                let alias = this.getFieldName(key);
                Object.keys(ov).forEach((operatorKeys) => {
                    let operatorValue = Reflect.get(ov, operatorKeys);
                    switch (operatorKeys) {
                        case OperationType_2.OperatorEnum.isNUll: {
                            clist.push(`ISNULL(${alias})`);
                            break;
                        }
                        case OperationType_2.OperatorEnum.isNotNull: {
                            clist.push(`${alias} IS NOT NULL`);
                            break;
                        }
                        case OperationType_2.OperatorEnum.in: {
                            clist.push(`${alias} IN (?)`);
                            params.push(operatorValue);
                            break;
                        }
                        default: {
                            clist.push(`${alias} ${operatorKeys} ?`);
                            params.push(operatorValue);
                            break;
                        }
                    }
                });
                if (clist.length == 1) {
                    list.push(clist[0]);
                }
                else {
                    list.push(`( ${clist.join(` AND `)})`);
                }
            }
        }
        if (list.length == 1) {
            return {
                sql: list[0],
                args: params,
            };
        }
        return {
            sql: `(${list.join(` ${joinKey} `)})`,
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
            sql: str.join(", "),
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
        let sql = `UPDATE ${this.tableName} SET ${rowStr.sql} ${whereC.sql} ${limitStr}`;
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
        let sql = `SELECT ${fields} FROM ${this.tableName} ${whereC.sql} ${groupStr} ${orderStr} ${limitStr}`;
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
        let sql = `SELECT 1 FROM ${this.tableName} ${whereC.sql} LIMIT 1`;
        let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });
        return rows.length > 0;
    }
    /***
     * @version 1.0 统计符合条件的记录
     */
    async count(where, sessionId, ds) {
        let whereC = this.analysisWhere(where);
        let args = whereC.args;
        let sql = `SELECT COUNT(1) as num FROM ${this.tableName} ${whereC.sql}`;
        let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });
        return rows[0].num;
    }
    /***
     * @version 1.0 按照条件删除记录
     */
    async delete(conditions, sessionId, ds) {
        let whereC = this.analysisWhere(conditions.where);
        let limitStr = this.analysisLimit(conditions.limit);
        let sql = `DELETE FROM ${this.tableName} ${whereC.sql} ${limitStr}`;
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
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "saveORUpdate", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "saveOne", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "saveList", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "update", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "updateOne", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "updateByPrimaryKey", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "select", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "selectOne", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "selectByPrimaryKey", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "exist", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "count", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "delete", null);
__decorate([
    __param(1, SqlSession_1.default), __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "deleteOne", null);
__decorate([
    __param(2, SqlSession_1.default), __param(3, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String, String]),
    __metadata("design:returntype", Promise)
], MysqlMapper.prototype, "execute", null);
exports.default = MysqlMapper;
