import { COSSDK, getSign } from "./index";

let account = {
	appid: "HIJ2odIuxdijosqfFHbls",
	serectkey: "78a4750ce0e76f489fd5c023f01e2eb9",
};

let sign = getSign(
	{
		appid: account.appid,
		expireTime: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
		dir_path: "/", //授权的可访问路径
		mode: 7, // 1可读 2可写 4可查 相互独立
	},
	account.serectkey
);

if (!sign) {
	console.error(`生成签名错误`);
} else {
	let cosSDK = new COSSDK({
		domain: "http://localhost",
		sign,
	});

	cosSDK.genAccountInfo().then((res) => {
		console.log(`生成账号信息---`, JSON.stringify(res));
	});

	cosSDK.getFile("/test/hello/test.txt").then((res) => {
		console.log(res.data);
	});

	//带鉴权的
	cosSDK
		.getFile("/test.txt", true)
		.then((res) => {
			console.log(res.data);
			console.log(res.headers["content-type"]);
		})
		.catch((e) => {
			console.log(e);
		});
	let blob = new Blob(["hello world"], { type: "text/plain" });
	let newBolb = new File([blob], "client.txt");

	cosSDK.uploadfile("/test/text.txt", newBolb).then((res) => {
		console.log(res.data.data);
	});

	cosSDK.deleteFile("/hello.txt").then((res) => {
		console.log(res);
	});

	cosSDK.queryFilelist("/test").then((res) => {
		console.log(JSON.stringify(res.data));
	});
}
