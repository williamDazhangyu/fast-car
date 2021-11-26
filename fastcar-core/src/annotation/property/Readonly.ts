/**
 * @version 1.0 用于标记只读 可作用于属性或者方法
 */
export default function Readonly(target: any, methodName: string, descriptor?: PropertyDescriptor) {
	if (!descriptor) {
		Reflect.defineProperty(target, methodName, {
			writable: false,
		});
	} else {
		descriptor.writable = false;
	}
}
