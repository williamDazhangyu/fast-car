import BindValue from "./BindValue";

export default function AppEnv(target: Object, propertyKey: string) {
	// //反向找设计类型
	BindValue({
		key: "application.env",
		target,
		propertyKey,
	});
}
