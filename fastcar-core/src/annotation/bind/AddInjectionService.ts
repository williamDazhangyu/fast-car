import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { InjectionMeta, InjectionType } from "../../type/ComponentDesc";

export function AddInjectionService({ target, propertyKey, kind, alias }: { target: Object; propertyKey: string; kind: InjectionType; alias?: string }) {
	let services: Array<InjectionMeta> = Reflect.getMetadata(FastCarMetaData.InjectionSingleInstance, target);

	if (!services) {
		services = [];
		Reflect.defineMetadata(FastCarMetaData.InjectionSingleInstance, services, target);
	}

	services.push({
		key: propertyKey,
		kind: kind,
		alias,
	});
}
