/** 向量相似度操作符 - pgvector 扩展 */
export enum VectorOperatorEnum {
	/** 欧几里得距离（L2）- 越小越相似 */
	l2Distance = "<->",
	/** 余弦距离 - 越小越相似 */
	cosineDistance = "<=>",
	/** 负内积 - 越小越相似（用于最大内积搜索） */
	innerProduct = "<#>",
}

/** 向量查询配置 */
export type VectorQuery = {
	/** 向量字段名 */
	field: string;
	/** 查询向量 */
	vector: number[] | Float32Array;
	/** 相似度操作符 */
	operator: VectorOperatorEnum;
	/** 返回TopK，默认10 */
	limit?: number;
};

/** 带过滤条件的向量查询配置 */
export type VectorQueryWithWhere = VectorQuery & {
	/** 额外的 WHERE 条件字段 */
	whereFields?: string[];
};
