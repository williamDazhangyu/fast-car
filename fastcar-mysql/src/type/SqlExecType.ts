export type SqlExecType = {
	sql: string;
	args?: any[];
	ds?: string;
	sessionId?: string;
	useServerPrepStmts?: boolean;
};
