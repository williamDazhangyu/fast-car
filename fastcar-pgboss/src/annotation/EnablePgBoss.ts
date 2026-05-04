import { ComponentInjection } from "@fastcar/core/annotation";

export default function EnablePgBoss(target: Function) {
	let fp = require.resolve("../PgBossManager");
	ComponentInjection(target, fp);
}
