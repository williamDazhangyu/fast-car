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
const annotation_1 = require("fastcar-core/annotation");
const db_1 = require("fastcar-core/db");
const MongoDataSourceManager_1 = require("../dataSource/MongoDataSourceManager");
const db_2 = require("fastcar-core/db");
const mongodb_1 = require("mongodb");
const utils_1 = require("fastcar-core/utils");
const OperatorEnumMapping_1 = require("../type/OperatorEnumMapping");
class MongoMapper extends db_2.BaseMapper {
    constructor() {
        super();
        this.primaryKey = "_id";
        this.mappingList.some(item => {
            if (item.primaryKey) {
                this.primaryKey = item.name;
                return true;
            }
            return false;
        });
    }
    covertEntity(row) {
        let data = {};
        this.mappingList.forEach(item => {
            let value = Reflect.get(row, item.name);
            if (utils_1.ValidationUtil.isNotNull(value)) {
                if (item.primaryKey) {
                    Reflect.set(data, "_id", new mongodb_1.ObjectId(value));
                    return;
                }
                Reflect.set(data, item.field, value);
            }
        });
        return data;
    }
    //获取数据库别名通过代码内的名称
    getFieldName(name) {
        if (this.primaryKey == name) {
            return "_id";
        }
        let info = this.mappingMap.get(name);
        return info ? info.field : name;
    }
    //转换操作符名称
    covertOperation(key) {
        return Reflect.get(OperatorEnumMapping_1.OperatorEnumMapping, key) || key;
    }
    //转换字段名称
    analysisFields(fields) {
        if (!fields || fields.length == 0) {
            return null;
        }
        let d = {};
        fields.forEach(item => {
            let alias = this.getFieldName(item);
            Reflect.set(d, alias, 1);
        });
        return { $project: d };
    }
    analysisCondition(where = {}, joinKey = "AND") {
        let keys = Object.keys(where);
        let list = [];
        if (keys.length == 0) {
            return {};
        }
        for (let key of keys) {
            let value = where[key];
            if (db_1.JoinEnum.and == key || db_1.JoinEnum.or == key) {
                //递归调用计算
                let childResult = this.analysisCondition(value, key);
                list.push(childResult);
            }
            else {
                let ov = {};
                //对缺省类型进行补充
                if (utils_1.TypeUtil.isArray(value)) {
                    //数组类型
                    Reflect.set(ov, db_1.OperatorEnum.in, value);
                }
                else if (utils_1.ValidationUtil.isNull(value)) {
                    //空值类型
                    Reflect.set(ov, db_1.OperatorEnum.isNUll, value);
                }
                else if (!utils_1.TypeUtil.isObject(value) || Object.keys(ov).length == 0) {
                    //基本类型
                    Reflect.set(ov, db_1.OperatorEnum.eq, value);
                }
                else {
                    ov = value;
                }
                //聚合类型
                let alias = this.getFieldName(key);
                let tmpv = {};
                Object.keys(ov).forEach(operatorKeys => {
                    let operatorValue = Reflect.get(ov, operatorKeys);
                    if (key == this.primaryKey || key == "_id") {
                        operatorValue = new mongodb_1.ObjectId(operatorValue);
                    }
                    switch (operatorKeys) {
                        case db_1.OperatorEnum.isNUll: {
                            Reflect.set(tmpv, "$eq", null);
                            break;
                        }
                        case db_1.OperatorEnum.isNotNull: {
                            Reflect.set(tmpv, "$ne", null);
                            break;
                        }
                        default: {
                            let tv = this.covertOperation(operatorKeys);
                            Reflect.set(tmpv, tv, operatorValue);
                            break;
                        }
                    }
                });
                let cv = {};
                Reflect.set(cv, alias, tmpv);
                list.push(cv);
            }
        }
        if (joinKey == "AND") {
            let obj = {};
            list.forEach(item => {
                let keys = Object.keys(item);
                let firstKey = keys[0];
                Reflect.set(obj, firstKey, item[firstKey]);
            });
            return obj;
        }
        else {
            return { $or: list };
        }
    }
    analysisWhere(where = {}, joinKey = "AND") {
        let finalResult = this.analysisCondition(where, joinKey);
        if (finalResult) {
            return finalResult;
        }
        return {};
    }
    analysisGroups(groups = []) {
        if (groups.length > 0) {
            let ids = {};
            groups.forEach(i => {
                let key = i.toString();
                let alias = this.getFieldName(key);
                Reflect.set(ids, key, `$${alias}`);
            });
            return { $group: { _id: ids } };
        }
        return null;
    }
    analysisOrders(orders = {}) {
        let keys = Object.keys(orders);
        if (keys.length > 0) {
            let o = {};
            keys.forEach(i => {
                let key = i.toString();
                let alias = this.getFieldName(key);
                let v = orders[key].toUpperCase();
                Reflect.set(o, alias, v == db_1.OrderEnum.asc ? 1 : -1);
            });
            return { $sort: o };
        }
        return null;
    }
    analysisLimit(limit, offest) {
        let filters = {};
        if (!utils_1.ValidationUtil.isNumber(limit)) {
            return null;
        }
        Reflect.set(filters, "$limit", limit);
        if (utils_1.ValidationUtil.isNumber(offest)) {
            Reflect.set(filters, "$skip", offest);
        }
        return filters;
    }
    analysisRow(row) {
        let o = {};
        Object.keys(row).forEach(key => {
            let alias = this.getFieldName(key);
            let v = Reflect.get(row, key);
            let originName = this.dbFields.get(alias);
            if (originName) {
                let desc = this.mappingMap.get(originName);
                if (desc) {
                    if (desc.primaryKey) {
                        return;
                    }
                }
            }
            Reflect.set(o, alias, v);
            return;
        });
        return Object.keys(o).length == 0 ? null : o;
    }
    async exec(opts, ds) {
        let list = [{ method: "collection", args: [this.tableName] }];
        return await this.dsm.execute({
            ds,
            params: [...list, ...opts],
        });
    }
    async saveORUpdate(rows, ds) {
        //分为含有主键和不含有主键的两大类
        if (!Array.isArray(rows)) {
            rows = [rows];
        }
        let saveRows = [];
        let updateRows = [];
        rows.forEach(row => {
            if (Reflect.has(row, this.primaryKey)) {
                updateRows.push(row);
            }
            else {
                saveRows.push(row);
            }
        });
        if (saveRows.length > 0) {
            await this.saveList(saveRows, ds);
        }
        if (updateRows.length > 0) {
            for (let u of updateRows) {
                await this.updateByPrimaryKey(u, ds);
            }
        }
        return rows.length;
    }
    async saveOne(row, ds) {
        let data = this.covertEntity(row);
        let result = await this.exec([{ method: "insertOne", args: [data] }], ds);
        let id = result.insertedId.toString();
        Reflect.set(row, this.primaryKey, id);
        return id;
    }
    async saveList(rows, ds) {
        if (rows.length < 1) {
            return Promise.reject(new Error("rows is empty"));
        }
        let dataList = [];
        for (let row of rows) {
            dataList.push(this.covertEntity(row));
        }
        let result = await this.exec([{ method: "insertMany", args: [dataList] }], ds);
        return result.insertedCount >= rows.length;
    }
    async update({ row, where }, ds) {
        let rowStr = this.analysisRow(row);
        if (!rowStr) {
            return Promise.reject(new Error("row is empty"));
        }
        let whereC = this.analysisWhere(where);
        let result = await this.exec([{ method: "updateMany", args: [whereC, { $set: rowStr }] }], ds);
        return result.modifiedCount > 0;
    }
    async updateOne({ row, where }, ds) {
        let rowStr = this.analysisRow(row);
        if (!rowStr) {
            return Promise.reject(new Error("row is empty"));
        }
        let whereC = this.analysisWhere(where);
        let result = await this.exec([{ method: "updateOne", args: [whereC, { $set: rowStr }] }], ds);
        return result.modifiedCount > 0;
    }
    async updateByPrimaryKey(row, ds) {
        let dbRow = this.covertEntity(row);
        let _id = Reflect.get(dbRow, "_id");
        if (!_id) {
            return Promise.reject(new Error("_id is empty"));
        }
        return await this.updateOne({ row: dbRow, where: { _id } }, ds);
    }
    async select(conditions, ds) {
        let searchArray = [];
        let fields = this.analysisFields(conditions.fields);
        if (fields) {
            searchArray.push(fields);
        }
        let whereC = this.analysisWhere(conditions.where);
        if (Object.keys(whereC).length > 0) {
            searchArray.push({ $match: whereC });
        }
        let groupStr = this.analysisGroups(conditions.groups);
        if (groupStr) {
            searchArray.push(groupStr);
        }
        let orderStr = this.analysisOrders(conditions.orders);
        if (groupStr) {
            searchArray.push(orderStr);
        }
        let limitStr = this.analysisLimit(conditions?.limit, conditions?.offest);
        if (limitStr) {
            searchArray.push(limitStr);
        }
        let rows = await this.exec([
            { method: "aggregate", args: [searchArray] },
            { method: "toArray", args: [] },
        ], ds);
        if (!Array.isArray(rows)) {
            return [];
        }
        return this.setRows(rows);
    }
    /***
     * @version 1.0 查询单个对象
     *
     */
    async selectOne(conditions, ds) {
        let queryInfo = Object.assign({}, conditions, { limit: 1 });
        let res = await this.select(queryInfo, ds);
        let o = res.length > 0 ? res[0] : null;
        return o;
    }
    /***
     * @version 1.0 通过主键查找对象
     *
     */
    async selectByPrimaryKey(row, ds) {
        let id = Reflect.get(row, this.primaryKey);
        if (!id) {
            return Promise.reject(new Error(`${this.tableName} primary key  is null`));
        }
        let sqlQuery = {
            where: {
                _id: id,
            }, //查询条件
        };
        return await this.selectOne(sqlQuery, ds);
    }
    async exist(where, ds) {
        let whereC = this.analysisWhere(where);
        let limitStr = this.analysisLimit(1);
        let rows = await this.exec([
            { method: "aggregate", args: [[{ $match: whereC }, limitStr]] },
            { method: "toArray", args: [] },
        ], ds);
        return rows.length > 0;
    }
    async count(where, ds) {
        let whereC = this.analysisWhere(where);
        let countC = { $group: { _id: null, count: { $sum: 1 } } };
        let res = await this.exec([
            { method: "aggregate", args: [[{ $match: whereC }, countC]] },
            { method: "toArray", args: [] },
        ], ds);
        if (res.length == 0) {
            return 0;
        }
        return res[0].count;
    }
    async delete(where, ds) {
        let wherec = this.analysisWhere(where);
        let res = await this.exec([{ method: "deleteMany", args: [wherec] }], ds);
        return res.deletedCount > 0;
    }
    async deleteOne(where, ds) {
        let wherec = this.analysisWhere(where);
        let res = await this.exec([{ method: "deleteOne", args: [wherec] }], ds);
        return res.deletedCount > 0;
    }
    async deleteByPrimaryKey(row, ds) {
        let id = Reflect.get(row, this.primaryKey);
        return await this.deleteOne({ _id: id }, ds);
    }
}
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", MongoDataSourceManager_1.default)
], MongoMapper.prototype, "dsm", void 0);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "saveORUpdate", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "saveOne", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "saveList", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "update", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "updateOne", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "updateByPrimaryKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "select", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "selectOne", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "selectByPrimaryKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "exist", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "count", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "delete", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "deleteOne", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MongoMapper.prototype, "deleteByPrimaryKey", null);
exports.default = MongoMapper;
