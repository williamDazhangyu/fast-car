import { ROUTER_MAP, ROUTE_METHODS } from "../common/ConstantFile";

export type UrlName = string;
export type MethodInfo = {

    urlName: string,
    methodName: string,
    methods: String[]
};

function addMapping(target: any, info: MethodInfo) {

    if (!Reflect.has(target, ROUTER_MAP)) {

        target[ROUTER_MAP] = new Map<UrlName, MethodInfo>();
    }

    let beforeInfo = target[ROUTER_MAP].get(info.urlName);
    if (!!beforeInfo) {

        beforeInfo.methods = [...beforeInfo.methods, ...info.methods];
    } else {

        target[ROUTER_MAP].set(info.urlName, info);
    }
}

export function GetMapping(url: string) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        addMapping(target, {
            urlName: url,
            methodName,
            methods: [ROUTE_METHODS.GetMapping]
        });
    }
};

export function PostMapping(url: string) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        addMapping(target, {
            urlName: url,
            methodName,
            methods: [ROUTE_METHODS.PostMapping]
        });
    }
};

export function DeleteMapping(url: string) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        addMapping(target, {
            urlName: url,
            methodName,
            methods: [ROUTE_METHODS.DeleteMapping]
        });
    }
};

export function PatchMapping(url: string) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        addMapping(target, {
            urlName: url,
            methodName,
            methods: [ROUTE_METHODS.PatchMapping]
        });
    }
};

export function PutMapping(url: string) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        addMapping(target, {
            urlName: url,
            methodName,
            methods: [ROUTE_METHODS.PutMapping]
        });
    }
};

export function AllMapping(url: string) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        addMapping(target, {
            urlName: url,
            methodName,
            methods: [ROUTE_METHODS.AllMapping]
        });
    }
};

//加载值头部的url
export function RequestMapping(url: string) {

    return function (target: any) {

        //赋值静态属性
        if (!!target.prototype && Reflect.has(target.prototype, ROUTER_MAP)) {

            let newMapping = new Map<UrlName, MethodInfo>();
            //追加url
            target.prototype[ROUTER_MAP].forEach((m: MethodInfo, u: UrlName) => {

                let newUrl = url + u;
                m.urlName = newUrl;

                newMapping.set(newUrl, m);
            });
            target.prototype[ROUTER_MAP] = newMapping;
        }
    }
};