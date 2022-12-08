# 基于@fastcar/core框架下对mysql的封装

## 快速安装

npm install @fastcar/mysql

## 结构说明

* MysqlMapper 类为实现BaseMapper接口，用于结构化数据映射成sql的操作类

* MysqlDataSourceManager 为实现对mysql2抽象化管理和管理整个组件的声明周期

## 使用说明

* 配置mysql配置文件如下
  * dataSoucreConfig: SqlConfig[];
  * slowSQLInterval: number; //单位毫秒默认500毫秒会输出
  * maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
  * printSQL: boolean; //是否打印sql
  * sessionTimeOut: number; //会话超时

* 应用入口开启

```ts
import { EnableMysql } from "@fastcar/mysql/annotation";

@Application
@EnableMysql  //开启mysql
class APP {
 app!: FastCarApplication;
}

export default = new APP();
```

* 声明数据库映射文件(可以用@fastcar/mysql-tool进行逆向生成)

```ts
import { Size, NotNull, Table, Field, DBType, PrimaryKey } from "@fastcar/core/annotation";
import "reflect-metadata";

@Table("test")
class Test {
 @Field("id")
 @DBType("int")
 @PrimaryKey  //是否为主键
 id!: number;

 @Field("name")
 @DBType("varchar")
 @NotNull
 @Size({ maxSize: 10 })
 name!: string;

 @Field("case_name")
 @DBType("varchar")
 @Size({ maxSize: 20 })
 caseName!: string;

 @Field("case_time")
 @DBType("datetime")
 caseTime!: Date;

 @Field("flag")
 @DBType("tinyint")
 flag: boolean = true;

 @Field("money")
 @DBType("decimal")
 money: number = 1.0; //默认值

 constructor(...args: any) {
  Object.assign(this, ...args);
 }
}

export default Test;

```

* 声明Mapper文件 便于curd操作

```ts
import { Entity, Repository } from "@fastcar/core/annotation";
import { MysqlMapper } from "@fastcar/mysql";
import Test from "../model/Test";

@Entity(Test) //绑定实体类
@Repository //标注为数据依赖
class TestMapper extends MysqlMapper<Test> {} //集成基础的MysqlMapper调用

export default TestMapper;
```

* 简单调用数据

```ts
import { Autowired, Service } from "@fastcar/core/annotation";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";

@Service
class SimpleService {
 @Autowired
 myMapper!: TestMapper;

 constructor() {}

 //查询
 async query() {
  let res = await this.myMapper.selectOne({
   where: {
    name: {
     value: "hello",
    },
   },
  });
  return res;
 }

 //更新或者添加
 async saveUpdate() {
  let test = new Test({ name: "ABC", caseTime: new Date() });
  let res = await this.myMapper.saveORUpdate(test);
  return res;
 }

 //添加
 async saveOne() {
  let test = new Test({ name: "aaa", caseTime: new Date(), money: 100000000 });
  let res = await this.myMapper.saveOne(test);
  return res;
 }

 //批量添加
 async saveList() {
  let test = new Test({ name: "bbb" });
  let test2 = new Test({ name: "ccc" });

  let res = await this.myMapper.saveList([test, test2]);
  return res;
 }

 //更新
 async update() {
  let res = await this.myMapper.update({ where: { id: 1 }, row: { name: "ABCD" } });
  return res;
 }

 async updateOne() {
  let row = { name: "ABCDE" };
  let res = await this.myMapper.updateOne({ where: { id: 1 }, row });
  return res;
 }

 async updateByPrimaryKey() {
  let test = new Test({ id: 1, name: "1234" });
  let res = await this.myMapper.updateByPrimaryKey(test);
  return res;
 }

 async selectOne() {
  let res = await this.myMapper.selectOne({
   where: {
    // AND: {
    name: "aaa",
    caseTime: { ">=": "2022-01-11", "<=": "2022-02-12" },
    // },
   },
  });
  return res;
 }

 async exist() {
  let res = await this.myMapper.exist({
   name: "124",
  });
  return res;
 }

 async count() {
  let countNum = await this.myMapper.count({ id: 1 });
  return countNum;
 }

 async delete() {
  let res = await this.myMapper.delete({
   where: {
    name: "bbb",
   },
  });
  return res;
 }

 //操作一个错误的
 async opeatorError() {
  return await this.myMapper.execute("select * from noExistTable");
 }
}

export default SimpleService;
```

* 多数据源实例

```ts
import { DS, Entity, Repository } from "@fastcar/core/annotation";
import { MysqlMapper } from "@fastcar/mysql";
import Test from "../model/Test";

@Entity(Test)
@Repository
@DS("test2") //指定数据源 不指定则为默认数据源
class TestMapper2 extends MysqlMapper<Test> {}

export default TestMapper2;
```

```ts
import { Autowired, Service } from "@fastcar/core/annotation";
import TestMapper from "../mapper/TestMapper";
import TestMapper2 from "../mapper/TestMapper2";
import Test from "../model/Test";

@Service
export default class TestDS {
 @Autowired
 myMapper!: TestMapper;

 @Autowired
 myMapper2!: TestMapper2;

 async switchDS() {
  await this.myMapper.saveOne(new Test({ name: "test", caseName: "数据源TEST1" }));
  await this.myMapper2.saveOne(new Test({ name: "test", caseName: "数据源TEST2" }));

  let result = await Promise.all([
    this.myMapper.selectOne({
        where: {
        name: "test",
        },
        fields: ["caseName"],
    }),
    this.myMapper2.selectOne({
        where: {
        name: "test",
        },
        fields: ["caseName"],
    }),
  ]);

  return result;
 }
}
```

* 事务实例

```ts
import { Autowired, Service, SqlSession, Transactional } from "@fastcar/core/annotation";
import { MysqlDataSourceManager } from "@fastcar/mysql";
import TestMapper from "../mapper/TestMapper";

@Service
class TestTransactional {
 @Autowired
 myMapper!: TestMapper;

 @Autowired
 private dsm!: MysqlDataSourceManager;

 async exec() {
  let sql = "update test set flag = 0 where id = 1 ";
  let sql2 = "update test set flag = 0 where id = 2";

  try {
   let res = await this.dsm.batchExecute([{ sql }, { sql: sql2 }]);
   return res;
  } catch (e) {
   return null;
  }
 }

 //必须是sessionId和Transactional配合使用，然后只有传入sessionId的执行语句才会生效
 @Transactional()
 async work(@SqlSession sessionId?: string) {
  let res = await this.myMapper.updateOne(
   {
    where: { id: 1 },
    row: { case_time: new Date() },
   },
   "",
   sessionId
  );
  let sql2 = "select * from noExistTable";
  await this.myMapper.execute(sql2, [], sessionId);
  return res;
 }

 //并发执行 但切记不要一次并发太多导致导致并发连接数占用过多
 @Transactional()
 async bacthExec(@SqlSession sessionId?: string) {
  let res = await Promise.all([
   this.myMapper.updateOne(
    {
     where: { id: 2 },
     row: { case_time: new Date() },
    },
    "",
    sessionId
   ),
   this.myMapper.updateOne(
    {
     where: { id: 3 },
     row: { case_time: new Date() },
    },
    "",
    sessionId
   ),
   this.myMapper.updateOne(
    {
     where: { id: 1 },
     row: { case_time: new Date() },
    },
    "",
    sessionId
   ),
   // this.myMapper.execute("select * from noExistTable", [], sessionId),
  ]);

  return res;
 }

 //嵌套执行
 @Transactional()
 async firstWork(@SqlSession sessionId?: string) {
  await this.myMapper.updateOne(
   {
    where: { id: 2 },
    row: { case_time: new Date() },
   },
   "",
   sessionId
  );
  //调用嵌套的
  return await this.secondWork(sessionId);
 }

 @Transactional()
 async secondWork(@SqlSession sessionId?: string) {
  let res = await this.myMapper.updateOne(
   {
    where: { id: 3 },
    row: { case_time: new Date() },
   },
   "",
   sessionId
  );
  return res;
 }
}

export default TestTransactional;
```

## 更多用法

参考项目git地址 @fastcar/mysql/test 下的example内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
