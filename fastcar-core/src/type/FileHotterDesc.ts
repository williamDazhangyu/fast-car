export type FileHotterDesc = {
	name: string;
	key: string | symbol;
};

export enum HotReloadEnum {
	reload = "reload",
	sysReload = "sysReload",
	configReload = "configReload",
	demandload = "demandload",
}
