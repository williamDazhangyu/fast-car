"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../../type/DesignMeta");
//加载值头部的url
function RequestMapping(url) {
    return function (target) {
        if (!url.startsWith("/")) {
            url = "/" + url;
        }
        let routerMap = Reflect.getMetadata(DesignMeta_1.DesignMeta.ROUTER_MAP, target);
        if (!!routerMap) {
            routerMap.forEach(item => {
                item.url = url + item.url;
            });
        }
    };
}
exports.default = RequestMapping;
