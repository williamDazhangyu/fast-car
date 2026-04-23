/** 向量索引类型 - pgvector 扩展 */
export enum VectorIndexType {
	/** 倒排文件平面索引 - 适合中等规模数据 */
	ivfflat = "ivfflat",
	/** 层次可导航小世界图 - 适合大规模数据，查询更快 */
	hnsw = "hnsw",
}

/** 向量索引配置 */
export type VectorIndexConfig = {
	/** 表名 */
	table: string;
	/** 向量列名 */
	column: string;
	/** 索引类型 */
	type: VectorIndexType;
	/** 距离操作符类型，默认 L2 */
	opClass?: "vector_l2_ops" | "vector_cosine_ops" | "vector_ip_ops";
	/** 
	 * ivfflat 参数: 倒排列表数
	 * 数据量越大，该值应越大（通常 100-1000）
	 * 默认 100
	 */
	lists?: number;
	/**
	 * hnsw 参数: 每层最大连接数
	 * 越大召回率越高，但索引越大
	 * 默认 16
	 */
	m?: number;
	/**
	 * hnsw 参数: 构建时的 ef（探索因子）
	 * 越大构建越慢，但召回率越高
	 * 默认 64
	 */
	efConstruction?: number;
};
