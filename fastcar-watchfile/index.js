"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watch = Watch;
exports.WatchSingleton = WatchSingleton;
const WatchFile_1 = require("./WatchFile");
const SingletonWatchSingle = null;
function Watch(config) {
    return new WatchFile_1.default(config);
}
//单例模式
function WatchSingleton(config) {
    return SingletonWatchSingle || new WatchFile_1.default(config);
}
