export type MysqlConfig = {
    source: string, //数据源名称
    host: string, //主机地址
    port: number,
    database: string,
    user: string,
    password: string,
    encryption?: boolean, //是否加密
    minConnection: number,
    maxConnection: number,
    queueLimit: number
}