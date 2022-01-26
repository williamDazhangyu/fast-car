"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentInjection_1 = require("./ComponentInjection");
function ComponentScan(...names) {
    return function (target) {
        ComponentInjection_1.default(target, ...names);
    };
}
exports.default = ComponentScan;
