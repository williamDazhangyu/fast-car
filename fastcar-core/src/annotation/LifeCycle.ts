/***
 * @version 1.0 生命周期用到的注解
 * 
 */
//在应用启动后触发
export function ApplicationStart(target: any) {

    target["applicationStart"] = true;
    target.prototype["applicationStart"] = true;
};

//在应用停止前触发
export function ApplicationStop(target: any) {

    target["applicationStop"] = true;
    target.prototype["applicationStop"] = true;
};