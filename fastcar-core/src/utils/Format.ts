export default class Format {
	static formatFirstToUp(str: string) {
		return str.charAt(0).toUpperCase() + str.substring(1);
	}

	static formatFirstToLow(str: string) {
		return str.charAt(0).toLowerCase() + str.substring(1);
	}

	static formatFirstToUpEnd(str: string) {
		return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
	}
}
