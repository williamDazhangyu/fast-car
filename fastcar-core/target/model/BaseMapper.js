"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DesignMeta_1 = require("../type/DesignMeta");
const DataFormat_1 = require("../utils/DataFormat");
class BaseMapper {
    /***
     * @version 1.0 对于类型做一个转换
     */
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
        this.mappingMap.forEach(item => {
            this.mappingList.push(item);
        });
    }
    //获取数据库别名通过代码内的名称
    getFieldName(name) {
        let info = this.mappingMap.get(name);
        return info ? info.field : name;
    }
    setRow(rowData) {
        let t = new this.classZ();
        this.mappingMap.forEach((item, key) => {
            let value = Reflect.get(rowData, item.field) || Reflect.get(rowData, key);
            if (value != null) {
                let fvalue = DataFormat_1.default.formatValue(value, item.type);
                Reflect.set(t, key, fvalue);
            }
        });
        return t;
    }
    setRows(rowDataList) {
        let list = Array.of();
        rowDataList.forEach(item => {
            list.push(this.setRow(item));
        });
        return list;
    }
    saveORUpdate(rows, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    saveOne(row, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    saveList(rows, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    update({ row, where, limit }, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    updateOne(sqlUpdate, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    updateByPrimaryKey(row, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    select(conditions, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    /***
     * @version 1.0 查询单个对象
     *
     */
    async selectOne(conditions, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    /***
     * @version 1.0 通过主键查找对象
     *
     */
    async selectByPrimaryKey(row, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    exist(where, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    count(where, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    delete(conditions, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    deleteOne(where, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
    deleteByPrimaryKey(row, ds, sessionId) {
        throw new Error("Method not implemented.");
    }
}
exports.default = BaseMapper;
