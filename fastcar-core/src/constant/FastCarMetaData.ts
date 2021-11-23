//元数据加载模块
export enum FastCarMetaData {

    LoadModuleMap = "LoadModuleMap", //应用服务需要加载的模块
    IocModule = "IocModule", //每个中间件需要加载的模块
    HandleModule = "HandleModule", //特殊处理时间的模块
    ScanPathList = "ScanPathList", //扫描路径
    ScanExcludePathList = "ScanExcludePathList", //排序的扫描路径
}