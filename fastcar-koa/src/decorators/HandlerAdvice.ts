/***
 * @version 1.0 处理服务加载 在指定的位置运行
 * 
 */
 export function HandlerAdvice(name: HANDLER_SERVICE) {

    return function (target: any) {

        Reflect.defineMetadata(FastCarMetaData.HandleModule, name, target);
        Component(target);
    }
}