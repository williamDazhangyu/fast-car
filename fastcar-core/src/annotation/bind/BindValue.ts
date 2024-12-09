import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { InjectionValueMeta } from "../../type/ComponentDesc";

export default function BindValue({ key, relayTarget, target, propertyKey }: { relayTarget?: Object; key: string; target: Object; propertyKey: string }) {
	let values: Array<InjectionValueMeta> = Reflect.getMetadata(FastCarMetaData.InjectionValue, target);
	if (!values) {
		values = [];
		Reflect.defineMetadata(FastCarMetaData.InjectionValue, values, target);
	}

	values.push({
		key,
		relayTarget,
		propertyKey,
	});
}
