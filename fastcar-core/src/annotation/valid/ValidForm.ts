import { FormRuleModel } from "../../model/FormRuleModel";
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
				return value[prop];
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
export default function ValidForm(rules: { [prop: string]: FormRuleModel }, paramIndex: number = 0) {
	//完善表单错误信息
	Object.keys(rules).forEach(prop => {
		let r = rules[prop];
		if (r.message) {
			r.nullMessage = r.nullMessage ? r.nullMessage : r.message;
			r.sizeMessgae = r.sizeMessgae ? r.sizeMessgae : r.message;
			r.typeMessage = r.typeMessage ? r.typeMessage : r.message;
		} else {
			r.nullMessage = `${prop} is required`;
			r.typeMessage = `${prop} type is ${r.type}`;
		}
	});

	return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
		let next = descriptor.value;

		//获取增强类型的增加严格校验
		let paramsTypes = Reflect.getMetadata(FastCarMetaData.paramTypes, target, methodName);

		//对rules进行进一步的补充
		let designObj = paramsTypes[paramIndex];
		let basicFlag = false;
		if (!designObj) {
			console.warn(`Design type not found by ${methodName} in ${paramIndex}`);
		} else {
			basicFlag = TypeUtil.isBasic(designObj.name);
			//获取表单类型
			if (TypeUtil.isClass(designObj)) {
				let childMap: Map<string, FormRuleModel> = Reflect.getMetadata(FastCarMetaData.ValidChildFormRules, designObj);
				if (childMap && childMap.size > 0) {
					//补充表单
					childMap.forEach((citem, prop) => {
						if (Reflect.has(rules, prop)) {
							//优先取表单里的
							rules[prop] = Object.assign(citem, rules[prop]);
						} else {
							Reflect.set(rules, prop, citem);
						}
					});
				}
			}
		}

		descriptor.value = function(...args: any[]) {
			let currObj = args[paramIndex];

			if (ValidationUtil.isNull(currObj)) {
				currObj = basicFlag ? "" : {};
			}

			for (let prop in rules) {
				let rule = rules[prop];

				//进行取值
				let val = getFormValue(currObj, prop, rule.defaultVal);

				//优先判断是否为必填项
				if (ValidationUtil.isNull(val)) {
					if (rule.required) {
						throwErrMsg(rule, prop, rule.nullMessage);
					} else {
						delFormValue(currObj, prop);
					}
				} else {
					//进行类型判断并赋值
					val = DATAFORMAT.formatValue(val, rule.type);
					//调用check的方法
					if (!ValidationUtil.checkType(val, rule.type)) {
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
			return Reflect.apply(next, this, args);
		};
	};
}
