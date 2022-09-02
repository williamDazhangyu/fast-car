import CallDependency from "./CallDependency";

/***
 * @version 1.0 说明哪些模块需要被加载
 * @version 1.1 更改为和call类型一致
 *
 */
export default function Autowired(target: any, propertyKey: string) {
	// //反向找设计类型
	CallDependency(target, propertyKey);
}
