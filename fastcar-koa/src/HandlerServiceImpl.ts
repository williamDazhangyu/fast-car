import Result from "../../fastcar-core/src/model/Result";
import HandlerServiceBase from "../../fastcar-core/src/interface/HandlerServiceBase";


export class KoaResultHandlerServiceImpl implements HandlerServiceBase {

    async handler(ctx: any, next: Function): Promise<void> {

        await next();
        //异常封装处理
        let res = ctx.body;
        if (!res) {

            console.error(ctx.url, "The return structure is empty");
            ctx.body = Result.errorMsg("The return structure is empty");
        } else {

            if (res instanceof Error) {

                ctx.body = Result.errorMsg(res.message);
                console.error(res.message);
                console.info(res.stack);
                console.error(res.name);
            }
        }
    }
};

export class FastCarExceptionHandlerService implements HandlerServiceBase {

    handler(...args: any[]): void {

    }
};

export class KoaExceptionHandlerService implements HandlerServiceBase {

    async handler(ctx: any, next: Function): Promise<void> {

        try {

            await next();
        } catch (err: any) {

            console.error(err.message);
            console.error(err.stack);
            ctx.body = Result.errorMsg(!!err ? err.message : "server is error");
        }
    }
};