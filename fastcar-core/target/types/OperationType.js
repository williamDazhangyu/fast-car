"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEnum = exports.JoinEnum = exports.JoinKeys = exports.OperatorEnum = void 0;
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
exports.JoinKeys = ["AND", "OR"];
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
