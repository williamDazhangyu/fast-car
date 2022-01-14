import { RouteMethods } from "../../type/RouteMethods";
import AddMapping from "./AddMapping";

export default function PatchMapping(url: string) {
	return function(target: any, name: string, descriptor: PropertyDescriptor) {
		AddMapping(target, {
			url,
			method: name,
			request: [RouteMethods.PatchMapping],
		});
	};
}
