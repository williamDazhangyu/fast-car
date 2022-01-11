import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import ClassUtils from "../../utils/ClassUtils";
import TypeUtil from "../../utils/TypeUtil";
import ValidationUtil from "../../utils/ValidationUtil";

//动态数据源获取 根据就近原则 传入参数-函数-类名
export default function DS(name: string) {
	return function(target: any, methodName?: string, descriptor?: PropertyDescriptor) {
		if (methodName && descriptor) {
			const orignFunction = descriptor.value;

			//定义数据源
			Reflect.defineMetadata(FastCarMetaData.DS, name, target, methodName);

			//取出ds标记的位置 在编译前规避这个问题
			const dsIndex = Reflect.getMetadata(FastCarMetaData.DSIndex, target, methodName);
			if (!ValidationUtil.isNumber(dsIndex)) {
				throw new Error(`${methodName} function dynamic data source not found`);
			}

			descriptor.value = function(...args: any[]) {
				let dsName = args[dsIndex];
				if (!dsName) {
					args[dsIndex] = name;
				}

				return Promise.resolve(Reflect.apply(orignFunction, this, args));
			};
		} else {
			Reflect.defineMetadata(FastCarMetaData.DS, name, target.prototype);

			//找所有的方法 将符合要求的进行注入定义
			let targetProto = target.prototype;
			let keys = ClassUtils.getProtoType(target);

			for (let key of keys) {
				let dsIndex = Reflect.getMetadata(FastCarMetaData.DSIndex, targetProto, key);
				if (ValidationUtil.isNumber(dsIndex)) {
					let originValue = Reflect.get(targetProto, key);
					if (TypeUtil.isFunction(originValue)) {
						Reflect.defineProperty(targetProto, key, {
							value: function(...args: any[]) {
								let dsName = args[dsIndex];
								if (!dsName) {
									let fnDSName = Reflect.getMetadata(FastCarMetaData.DS, targetProto, key);
									args[dsIndex] = fnDSName || name;
								}

								return Promise.resolve(Reflect.apply(originValue, this, args));
							},
						});
					}
				}
			}
		}
	};
}
