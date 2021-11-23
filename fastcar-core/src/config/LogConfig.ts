export interface LogConfig {
    appenders: { [name: string]: any; }
    categories: { [name: string]: { appenders: string[]; level: string; enableCallStack?: boolean; } }
    pm2?: boolean;
    pm2InstanceVar?: string;
    levels?: string[];
    disableClustering?: boolean;
    replaceConsole?: boolean; //是否替换console打印
}