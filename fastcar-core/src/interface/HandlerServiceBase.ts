
//异常捕捉封装
export default interface HandlerServiceBase {

    handler(...args:any[]): void;
}