export type SignType = {
	appid: string; //账号id
	expireTime: number; //时间戳精确到秒
	dir_path: string; //授权的可访问路径
	mode: number; // 1可读 2可写 4可查 相互独立
};
