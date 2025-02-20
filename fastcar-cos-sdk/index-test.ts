import { COSSDK, getSign } from "./index";

let account = {
	appid: "mSaZM5ZsXXJxgWjNtlqeF",
	serectkey: "c0ef11c3d3686164a0bbf4d99d23692a",
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

	cosSDK.initAccount().then((res) => {
		console.log(res.data.appid);
	});

	cosSDK.addAccount().then((res) => {
		console.log(res.data);
	});

	cosSDK.delAccount("nVOGBjReJ35c7ThUX5XSZ").then((res) => {
		console.log(res.code);
	});

	cosSDK.getPermissions({ filename: "/test/b.txt" }).then((res) => {
		console.log(res);
	});

	cosSDK.setPermissions({ filename: "/test/b.txt", permission: "public" }).then((res) => {
		console.log(res.code);
	});

	cosSDK
		.delPermissions({
			filename: "/test/b.txt",
		})
		.then((res) => {
			console.log(res);
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

	cosSDK.setRedirect({
		redirectUrl: "/test/hello.txt",
		flag: false,
		bucket: "test",
	});

	cosSDK.getAccountList().then((res) => {
		console.log(res);
	});

	cosSDK.checkSign().then((res) => {
		console.log(res);
	});

	cosSDK.rename("/test/earth/client.txt", "/test/earth/client1.txt").then((res) => {
		console.log(res);
	});
}
