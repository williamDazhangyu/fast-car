function getFieldName(alias: string): string {
	//转义不转换函数
	let list = alias.match(/\((.+?)\)/g);
	if (list && list.length > 0) {
		let tmpStr = alias;
		list.forEach((item) => {
			let word = `(\`${item.substring(1, item.length - 1)}\`)`;
			tmpStr = tmpStr.replace(item, word);
		});
		return tmpStr;
	}

	return `\`${alias}\``;
}

//转义字符
console.log(getFieldName("hello"));

console.log(getFieldName("MAX(123)SUM(123)hahah"));
