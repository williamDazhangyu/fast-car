import Configure from "../../../../src/annotation/stereotype/Configure";

@Configure(`evnconfig-${process.env.NODE_ENV}.yml`)
export default class EnvConfig {
	text!: string;
}
