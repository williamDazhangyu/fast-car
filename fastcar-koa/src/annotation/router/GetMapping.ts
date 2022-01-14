import { RouteMethods } from "../../type/RouteMethods";
import AddMapping from "./AddMapping";

export default function GetMapping(url: string) {
	return function(target: any, name: string, descriptor: PropertyDescriptor) {
		AddMapping(target, {
			url,
			method: name,
			request: [RouteMethods.GetMapping],
		});
	};
}
