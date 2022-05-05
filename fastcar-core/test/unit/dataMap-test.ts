import DataMap from "../../src/model/DataMap";

describe("数据集合测试", () => {
	it("数据集合", () => {
		type User = {
			uid: number;
			name: string;
			desc?: {
				detail: string;
			};
		};

		let n: DataMap<number, User> = new DataMap();
		n.set(1, {
			uid: 1,
			name: "小明",
		});
		n.set(2, {
			uid: 2,
			name: "小王",
			desc: {
				detail: "住在隔壁",
			},
		});

		let xiaoming = n.get(1);
		console.log(xiaoming?.name == "小明");

		let oo: { [key: number]: User } = n.toObject();
		console.log(oo[1]);

		let searchList = n.findByAtts({ uid: 1 });
		console.log(searchList);

		//复合型查询
		let searchList2 = n.findByAtts({ "desc.detail": "住在隔壁" });
		console.log(searchList2);

		let sortList = n.sort([
			{
				field: "uid",
				order: true, //true为倒序
			},
		]);

		console.log(sortList);
	});
});
