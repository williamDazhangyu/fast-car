export type CheckTool = {
	fn: (val: any) => boolean;
	message?: string;
};

export interface FormRuleModel {
	message?: string; //错误信息
	type: string; // 类型
	minSize?: number; //最小值
	maxSize?: number; //最大值
	required?: boolean; //是否为必填项
	defaultVal?: any; //默认值
	filters?: CheckTool[]; //校验方法
	nullMessage?: string; //是否为空的错误提示
	sizeMessgae?: string; //长度错误提示
	typeMessage?: string; //类型错误提示
}
