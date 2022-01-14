"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RouteMethods_1 = require("../../type/RouteMethods");
const AddMapping_1 = require("./AddMapping");
function PatchMapping(url) {
    return function (target, name, descriptor) {
        AddMapping_1.default(target, {
            url,
            method: name,
            request: [RouteMethods_1.RouteMethods.PatchMapping],
        });
    };
}
exports.default = PatchMapping;
