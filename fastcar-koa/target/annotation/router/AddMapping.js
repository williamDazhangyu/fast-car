"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../../type/DesignMeta");
function AddMapping(target, info) {
    if (!info.url) {
        info.url = info.method;
    }
    //格式化url 以/开头
    if (!info.url.startsWith("/")) {
        info.url = "/" + info.url;
    }
    let routerMap = Reflect.getMetadata(DesignMeta_1.DesignMeta.ROUTER_MAP, target);
    if (!routerMap) {
        routerMap = new Map();
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.ROUTER_MAP, routerMap, target);
    }
    let curr = routerMap.get(info.url);
    if (!curr) {
        routerMap.set(info.url, info);
    }
    else {
        if (info.url != curr.url) {
            console.warn(`The two URL names are inconsisten in (${info.url},${curr.url})`);
        }
        curr.request = [...info.request, ...curr.request];
    }
}
exports.default = AddMapping;
