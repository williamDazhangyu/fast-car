"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignMeta = exports.BaseMapper = exports.OrderEnum = exports.JoinEnum = exports.OperatorEnum = void 0;
const BaseMapper_1 = require("./model/BaseMapper");
exports.BaseMapper = BaseMapper_1.default;
var OperatorEnum;
(function (OperatorEnum) {
    OperatorEnum["eq"] = "=";
    OperatorEnum["neq"] = "!=";
    OperatorEnum["gt"] = ">";
    OperatorEnum["gte"] = ">=";
    OperatorEnum["lt"] = "<";
    OperatorEnum["lte"] = "<=";
    OperatorEnum["like"] = "LIKE";
    OperatorEnum["in"] = "IN";
    OperatorEnum["isNUll"] = "ISNULL";
    OperatorEnum["isNotNull"] = "IS NOT NULL";
    OperatorEnum["inc"] = "+";
    OperatorEnum["dec"] = "-";
    OperatorEnum["multiply"] = "*";
    OperatorEnum["division"] = "/";
})(OperatorEnum = exports.OperatorEnum || (exports.OperatorEnum = {}));
var JoinEnum;
(function (JoinEnum) {
    JoinEnum["and"] = "AND";
    JoinEnum["or"] = "OR";
})(JoinEnum = exports.JoinEnum || (exports.JoinEnum = {}));
var OrderEnum;
(function (OrderEnum) {
    OrderEnum["asc"] = "ASC";
    OrderEnum["desc"] = "DESC";
})(OrderEnum = exports.OrderEnum || (exports.OrderEnum = {}));
var DesignMeta;
(function (DesignMeta) {
    DesignMeta["table"] = "db:table";
    DesignMeta["field"] = "db:field";
    DesignMeta["fieldMap"] = "db:fieldMap";
    DesignMeta["dbType"] = "db:dbType";
    DesignMeta["primaryKey"] = "db:primaryKey";
    DesignMeta["entity"] = "db:entity";
    DesignMeta["mapping"] = "db:mapping";
    DesignMeta["dbFields"] = "db:fields";
    DesignMeta["sqlSession"] = "SqlSession";
})(DesignMeta = exports.DesignMeta || (exports.DesignMeta = {}));
