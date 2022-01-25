import AddChildValid from "./AddChildValid";
type checkfun = (val: any) => boolean;

//自定义表单校验
export default function ValidCustom(fn: checkfun, message?: string) {
	return function(target: any, propertyKey: string, index?: number) {
		AddChildValid(
			target,
			propertyKey,
			{
				filters: [
					{
						fn,
						message,
					},
				],
			},
			index
		);
	};
}
