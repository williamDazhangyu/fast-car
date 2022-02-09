"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../../type/DesignMeta");
const utils_1 = require("fastcar-core/utils");
//加载值头部的url
function RequestMapping(url) {
    return function (target) {
        let tname = utils_1.FormatStr.formatFirstToLow(target.name);
        let headUrl = url || tname;
        if (!headUrl.startsWith("/")) {
            headUrl = "/" + headUrl;
        }
        let routerMap = Reflect.getMetadata(DesignMeta_1.DesignMeta.ROUTER_MAP, target.prototype);
        if (!!routerMap) {
            routerMap.forEach(item => {
                item.url = headUrl + item.url;
            });
        }
    };
}
exports.default = RequestMapping;
