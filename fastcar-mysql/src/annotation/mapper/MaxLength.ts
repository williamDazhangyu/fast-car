import { DesignMeta } from "../../type/DesignMeta";

//限制的最大长度
export default function MaxLength(length: number, scale?: number) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata(
			DesignMeta.maxLength,
			{
				length,
				scale,
			},
			target,
			propertyKey
		);
	};
}
