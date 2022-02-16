import "reflect-metadata";
import { DesignMeta } from "../../type/DesignMeta";

//事务管理会话
export default function SqlSession(target: any, name: string, index: number) {
	Reflect.defineMetadata(DesignMeta.sqlSession, index, target, name);
}
