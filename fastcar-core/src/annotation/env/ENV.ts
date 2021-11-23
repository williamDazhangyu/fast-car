import "reflect-metadata";
//设置初始化的env
export function ENV(name: string) {

    return function (target: any) {

        Reflect.defineMetadata('ENV', name, target.prototype);
    }
}