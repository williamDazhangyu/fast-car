import * as koaStatic from 'koa-static';
import * as KoaRange from "koa-range";
import * as fs from 'fs';
import * as koaBody from 'koa-body';

export type KoaStaticConfig = {
    filePath: string,
    defer?: boolean
};

/***
 * @version 1.0 koa 工具类 集成一些koa的系统功能
 * 
 */
export function koaStaticInit(server: any, list: KoaStaticConfig[]) {

    server.use(KoaRange);
    for (let item of list) {

        let absolutePath = item.filePath;
        //进行判断
        if (!fs.existsSync(absolutePath)) {

            console.error(`${absolutePath} is not found`);
            continue;
        }

        server.use(koaStatic(absolutePath, { defer: !!item.defer }));
    }

    return true;
}

export function koaBodyInit(server:any, config:koaBody.IKoaBodyOptions) {

     server.use(koaBody(config));
}