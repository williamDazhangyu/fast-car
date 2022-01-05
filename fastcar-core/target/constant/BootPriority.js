"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootPriority = void 0;
var BootPriority;
(function (BootPriority) {
    BootPriority[BootPriority["Base"] = 0] = "Base";
    BootPriority[BootPriority["Sys"] = 1] = "Sys";
    BootPriority[BootPriority["Common"] = 2] = "Common";
    BootPriority[BootPriority["Other"] = 3] = "Other";
    BootPriority[BootPriority["Lowest"] = 10000] = "Lowest";
})(BootPriority = exports.BootPriority || (exports.BootPriority = {}));
