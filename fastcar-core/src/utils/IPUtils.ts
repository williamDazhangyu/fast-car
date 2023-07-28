const getIPNum = function (address: string) {
	let ip = address.split(".");
	let total = 0;
	ip.forEach((item, index) => {
		total += parseInt(item) * Math.pow(256, 3 - index);
	});

	return total;
};

const InnerIPList = [
	["10.0.0.0", "10.255.255.255"],
	["172.16.0.0", "172.31.255.255"],
	["192.168.0.0", "192.168.255.255"],
	["127.0.0.0", "127.255.255.255"],
].map((item) => {
	return [getIPNum(item[0]), getIPNum(item[1])];
});

export default class IPUtils {
	static isInnerIP = (ip: string): boolean => {
		let n = ip.split(".");
		if (n.length != 4) {
			return false;
		}
		let ipn = getIPNum(ip);
		return InnerIPList.some((item) => {
			return ipn >= item[0] && ipn <= item[1];
		});
	};
}
