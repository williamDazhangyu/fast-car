# 基于fastcar-core框架下对mongo的封装

## 快速安装

npm install fastcar-mongo

## 结构说明

* MongoMapper 类为实现BaseMapper接口，用于结构化数据映射成mongo的结构化操作类

* MongoDataSourceManager 为实现对mongodb抽象化管理和管理整个组件的声明周期

## 使用说明

* 配置mongo配置文件如下
 dataSoucreConfig: SqlConfig[];
 slowSQLInterval: number; //单位毫秒默认500毫秒会输出
 maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
 printSQL: boolean; //是否打印sql
 sessionTimeOut: number;

* 应用入口开启

```ts
import { EnableMysql } from "fastcar-mongo/annotation";

@Application
@EnableMongo  //开启mongo
class APP {
 app!: FastCarApplication;
}

export default = new APP();
```

* 声明和mongo的映射文件

```ts
import { Size, NotNull, Table, Field, DBType, PrimaryKey } from "fastcar-core/annotation";

@Table("test")
class Test {
 @Field("id")
 @DBType("int")
 @PrimaryKey
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
 caseTime: Date = new Date();

 @Field("flag")
 @DBType("tinyint")
 flag: boolean = true;

 @Field("money")
 @DBType("decimal")
 money: number = 1.0;

 constructor(...args: any) {
  Object.assign(this, ...args);
 }
}

export default Test;
```

* 声明crud操作

```ts
import { Entity, Repository } from "fastcar-core/annotation";
import { MongoMapper } from "fastcar-mongo";
import Test from "../model/Test";

@Entity(Test)
@Repository
class TestMapper extends MongoMapper<Test> {}

export default TestMapper;
```

* curd 示例操作

```ts
import { Autowired, Service } from "fastcar-core/annotation";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";

@Service
class CrudService {
 @Autowired
 private testMapper!: TestMapper;

 async save() {
  let t = new Test({ name: "hello", caseTime: new Date() });
  let res = await this.testMapper.saveOne(t);
  return res;
 }

 async saveList() {
  let t = new Test({ name: "hello", caseTime: new Date() });
  let res = await this.testMapper.saveList([t, t]);
  return res;
 }

 async update() {
  let res = await this.testMapper.update({ row: { name: "world" }, where: { name: "hello" } });
  return res;
 }

 async updateOne() {
  let res = await this.testMapper.updateOne({ row: { name: "hello" }, where: { name: "world" } });
  return res;
 }

 async updateByPrimaryKey() {
  let t = new Test({ id: "620b4fb728872705561f0beb", caseTime: new Date() });
  let res = await this.testMapper.updateByPrimaryKey(t);
  return res;
 }

 async select() {
  let list = await this.testMapper.select({ where: { money: 1 } });
  return list;
 }

 async selectOne() {
  let t = await this.testMapper.selectOne({ where: { name: "world" } });
  return t;
 }

 async selectByPrimaryKey() {
  let t = new Test({ id: "620b4fb728872705561f0beb" });
  return await this.testMapper.selectByPrimaryKey(t);
 }

 async exist() {
  return await this.testMapper.exist({ name: "world" });
 }

 async count() {
  return await this.testMapper.count({ name: "world" });
 }

 async delete() {
  return await this.testMapper.delete({ name: "hello" });
 }

 async deleteOne() {
  return await this.testMapper.deleteOne({ name: "hello" });
 }

 async deleteByPrimaryKey() {
  let n = new Test({ id: "620c6ddac6a2e5794dac64e8" });
  return await this.testMapper.deleteByPrimaryKey(n);
 }
}

export default CrudService;

```

* 多数据源操作

```ts
import { DS, Entity, Repository } from "fastcar-core/annotation";
import Test from "../model/Test";
import { MongoMapper } from "fastcar-mongo";

@Entity(Test)
@Repository
@DS("test2") //如果不指定则为默认数据源
class Test2Mapper extends MongoMapper<Test> {}

export default Test2Mapper;

```

```ts
import { Autowired, Service } from "fastcar-core/annotation";
import Test2Mapper from "../mapper/Test2Mapper";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";

@Service
export default class DSService {
 @Autowired
 private testMapper!: TestMapper;

 @Autowired
 private test2Mapper!: Test2Mapper;

 async switchDS() {
  let d1 = new Test({ name: "first ds" });
  let d2 = new Test({ name: "second ds" });

  await this.testMapper.saveOne(d1);
  await this.test2Mapper.saveOne(d2);

  let db1 = await this.testMapper.selectByPrimaryKey(d1);
  let db2 = await this.test2Mapper.selectByPrimaryKey(d2);

  console.log("datasource1---", db1?.name);
  console.log("datasource2---", db2?.name);
 }
}
```

## 更多用法

参考项目git地址 fastcar-mongo/test 下的example内

## 项目开源地址

* 项目下载 git clone <https://e.coding.net/william_zhong/fast-car/fast-car.git>

* 在线查看 <https://william_zhong.coding.net/public/fast-car/fast-car/git/files>
