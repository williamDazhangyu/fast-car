//获取原属性值

import BindValue from "./BindValue";

//application 代表系统参数
//sys 从设置中取参数
//其他默认第一个代表 资源路径下的地址
/**
 * @since 3.0.2
 * @version 1.0 获取系统配置参数根据
 * @param key 根据application,setting进行,如果有target则优先根据target进行
 */
export default function Value(key: string, relayTarget?: Object) {
	return function (target: Object, propertyKey: string) {
		BindValue({
			key,
			relayTarget,
			target,
			propertyKey,
		});
	};
}
