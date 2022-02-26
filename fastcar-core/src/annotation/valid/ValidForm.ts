import { FormRuleModel, FormRuleType } from "../../model/FormRuleModel";
import ValidError from "../../model/ValidError";
import { TypeUtil } from "../../utils";
import ValidationUtil from "../../utils/ValidationUtil";
import DATAFORMAT from "../../utils/DataFormat";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

function throwErrMsg(rule: FormRuleModel, prop: string, msg?: string) {
	let showMsg = msg;
	if (!showMsg) {
		showMsg = rule.message ? rule.message : `The ${prop} parameter is invalid `;
	}
	throw new ValidError(showMsg);
}

function getFormValue(value: any, prop: string, defaultValue?: any) {
	//查看是否校验子属性
	if (ValidationUtil.isNotNull(value)) {
		if (TypeUtil.isObject(value)) {
			if (Reflect.has(value, prop)) {
				let propValue = Reflect.get(value, prop);
				if (ValidationUtil.isNotNull(propValue)) {
					return propValue;
				}
			}
		} else {
			return value;
		}
	}

	if (ValidationUtil.isNotNull(defaultValue)) {
		return defaultValue;
	}

	return null;
}

function setFormValue(obj: any, prop: string, val: any) {
	//查看是否校验子属性
	if (ValidationUtil.isNotNull(obj)) {
		if (TypeUtil.isObject(obj)) {
			Reflect.set(obj, prop, val);
		} else {
			obj = val;
		}
	}

	return obj;
}

function delFormValue(value: any, prop: string) {
	if (ValidationUtil.isNotNull(value)) {
		if (TypeUtil.isObject(value)) {
			if (Reflect.has(value, prop)) {
				Reflect.deleteProperty(value, prop);
			}
		}
	}
}

/***
 * @version 1.0 校验表单 支持校验大小 类型 和自定义方法
 * @param rules key - value的形式 通常一个参数一个校验方式
 * @param paramIndex 位于第几个参数的校验表单
 *
 */
export default function ValidForm(target: any, methodName: string, descriptor: PropertyDescriptor) {
	let next = descriptor.value;

	descriptor.value = function(...args: any[]) {
		let rulesMap: Map<number, FormRuleType> = Reflect.getMetadata(FastCarMetaData.ValidFormRules, target, methodName);

		if (rulesMap && rulesMap.size > 0) {
			rulesMap.forEach((item, paramIndex) => {
				let { rules, basicFlag } = item;
				let currObj = args[paramIndex];

				if (ValidationUtil.isNull(currObj)) {
					currObj = basicFlag ? "" : {};
				}

				for (let prop in rules) {
					let rule = rules[prop];

					//进行取值
					let val = getFormValue(currObj, prop, rule.defaultVal);

					//判断关键字是否相同
					if (`${methodName}-${paramIndex}` == prop) {
						val = currObj || rule.defaultVal;
					}

					//优先判断是否为必填项
					if (ValidationUtil.isNull(val)) {
						if (rule.required) {
							throwErrMsg(rule, prop, rule.nullMessage);
						} else {
							delFormValue(currObj, prop);
						}
					} else {
						//进行类型判断并赋值
						let checkType = rule.type || "string";
						val = DATAFORMAT.formatValue(val, checkType);
						//调用check的方法
						if (!ValidationUtil.checkType(val, checkType)) {
							throwErrMsg(rule, prop, rule.typeMessage);
						}

						//判断长度
						if (rule?.minSize) {
							if (!ValidationUtil.isNotMinSize(val, rule.minSize)) {
								throwErrMsg(rule, prop, rule.sizeMessgae ? rule.sizeMessgae : `${prop} should be greater than ${rule.minSize} `);
							}
						}

						if (rule?.maxSize) {
							if (!ValidationUtil.isNotMaxSize(val, rule.maxSize)) {
								throwErrMsg(rule, prop, rule.sizeMessgae ? rule.sizeMessgae : `${prop} should be less than ${rule.maxSize} `);
							}
						}

						//自定义方法校验
						if (Array.isArray(rule.filters)) {
							for (let fnItem of rule.filters) {
								let fn = fnItem.fn;
								let flag = Reflect.apply(fn, this, [val]);
								if (!flag) {
									//抛出错误提示
									throwErrMsg(rule, prop, fnItem.message || rule.message);
								}
							}
						}

						//进行赋值
						currObj = setFormValue(currObj, prop, val);
					}
				}

				args[paramIndex] = currObj;
			});
		}

		return Reflect.apply(next, this, args);
	};
}
