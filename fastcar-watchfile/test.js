"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const WatchFile_1 = require("./WatchFile");
let w = new WatchFile_1.default({
    pollInterval: 1000,
    notifyTime: 1000,
});
const context = {
    emit: (eventName, fp) => {
        console.log(`热更资源---`, fp);
    },
};
w.addWatch({
    fs: path.join(__dirname, "aa.txt"),
    context,
    eventName: "test",
});
