import ComponentInjection from "./ComponentInjection";

export default function ComponentScan(...names: string[]) {
	return function(target: any) {
		ComponentInjection(target, ...names);
	};
}
