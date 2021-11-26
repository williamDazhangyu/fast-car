const DEFAULT_MSG = "This function will be removed in future versions.";

/****
 * @version 1.0 用于标记弃用
 */
export default function Deprecate(msg = DEFAULT_MSG) {
	return function(target: any, prop?: string, descriptor?: PropertyDescriptor) {
		console.warn(prop ? prop : Reflect.get(target, "name"), msg);
		if (descriptor) {
			const fn = descriptor.value;
			descriptor.value = function(...args: any) {
				console.warn(prop, msg);
				return Reflect.apply(fn, this, args);
			};
		}
	};
}
