"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DataMap extends Map {
    constructor() {
        super();
    }
    toValues() {
        return [...this.values()];
    }
    toKeys() {
        return [...this.keys()];
    }
    //自定义排序 支持多个排序
    sort(sorts, list) {
        list = !list ? this.toValues() : list;
        if (!sorts || sorts?.length == 0) {
            return list;
        }
        let total = sorts.length;
        list.sort((a, b) => {
            let resultNum = 0;
            sorts.some((f, index) => {
                let field = f.field;
                let aValue = Reflect.get(a, field);
                let bValue = Reflect.get(b, field);
                let flag = !!f.compare ? f.compare(aValue, aValue) : aValue > bValue;
                if (!!flag) {
                    resultNum = total - index;
                    //降序则倒着
                    if (f.order) {
                        resultNum = -resultNum;
                    }
                    return true;
                }
                return false;
            });
            return resultNum;
        });
        return list;
    }
    /***
     * @version 1.0 查找属性名称
     * @params atts代表属性键值对匹配
     *
     */
    findByAtts(atts) {
        let list = this.toValues();
        return list.filter(item => {
            return Object.keys(atts).every(key => {
                let v = Reflect.get(atts, key);
                let itemV = Reflect.get(item, key);
                return itemV == v;
            });
        });
    }
}
exports.default = DataMap;
