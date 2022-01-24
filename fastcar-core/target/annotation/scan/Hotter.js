"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const __1 = require("../..");
function Hotter(target) {
    Reflect.defineMetadata(__1.FastCarMetaData.Hotter, true, target.prototype);
}
exports.default = Hotter;
