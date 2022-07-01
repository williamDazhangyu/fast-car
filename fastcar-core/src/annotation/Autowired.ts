import ReflectUtil from "../utils/ReflectUtil";
import AddRequireModule from "./AddRequireModule";

/***
 * @version 1.0 说明哪些模块需要被加载
 *
 *
 */
export default function Autowired(target: any, propertyKey: string) {
	//反向找设计类型
	let key = ReflectUtil.getNameByPropertyKey(target, propertyKey);
	AddRequireModule(target, propertyKey, key);
}
