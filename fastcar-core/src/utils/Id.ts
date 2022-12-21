//生成唯一ID
let idCounter = 0;

function id(): number {
	return ++idCounter;
}

export { id };
