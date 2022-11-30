import WhereModel from "../../src/util/WhereModel";

enum STATUS {
	SUCCESS = 1,
	FAIL = 2,
}

describe("条件测试", () => {
	it("条件集合测试", () => {
		let where = new WhereModel();
		where.addFiled({ hello: "world" });
		where.addFiled({ time: { ">=": 1 } });
		where.addFiled({ time: { "<=": null } });
		where.addFiled({ status: STATUS.SUCCESS });

		console.log(JSON.stringify(where.toObject()));
	});

	it("给定复合条件", () => {
		let obj = {
			hello: "world",
			time: {
				">=": 1,
				"<=": 2,
			},
			status: STATUS.SUCCESS,
			no_exist: { hello: "world" },
		};

		let where1 = new WhereModel(obj, {
			excludeField: ["no_exist"],
		});
		console.log("where1", JSON.stringify(where1.toObject()));

		let where2 = new WhereModel(obj, {
			field: ["hello"],
		});
		console.log("where2", JSON.stringify(where2.toObject()));

		let where3 = new WhereModel(obj);
		console.log("where3", JSON.stringify(where3.toObject()));
	});

	it("过滤控制", () => {
		let obj = {
			hello: "world",
			empty: null,
		};

		let where = new WhereModel(obj).filterNull();
		console.log(where);
	});

	it("数组值赋值", () => {
		let where = new WhereModel({
			list: [1, 2, 3, 4],
		});

		console.log(JSON.stringify(where.toObject()));
	});
});
