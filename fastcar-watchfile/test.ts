import path = require("path");
import WatchFile from "./WatchFile";

let w = new WatchFile({
	pollInterval: 1000,
	notifyTime: 1000,
});

const context = {
	emit: (eventName: string | symbol, fp: string) => {
		console.log(`热更资源---`, fp);
	},
};

w.addWatch({
	fp: path.join(__dirname, "aa.txt"),
	context,
	eventName: "test",
});
