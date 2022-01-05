"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlConfigDefault = void 0;
exports.MySqlConfigDefault = {
    slowSQLInterval: 500,
    maximumConnectionReleaseTime: 10000,
    printSQL: false,
    sessionTimeOut: 5000, //如果开启事务后5秒内仍不释放则主动释放
};
