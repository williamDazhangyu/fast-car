import { ApplicationConfig } from "./ApplicationConfig"

/***
 * @version 1.0 系统基础配置
 */
 export type SYSConfig = {

    applicaion: ApplicationConfig, //应用配置
    settings: Map<string, any>,  //自定义设置项
}

export const SYSDefaultConfig: SYSConfig = {
    applicaion: {
        name: "FAST_CAR",
        port: 80,
        env: "development",
        serverIP: "localhost"
    },
    settings: new Map<string, Object>(), //自定义配置
}