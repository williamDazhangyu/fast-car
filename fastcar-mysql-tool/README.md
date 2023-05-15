# 基于@fastcar/core框架下的 mysql 逆向生成工具

## 快速安装

npm install @fastcar/mysql-tool

## 实例

```ts
import { ReverseGenerate } from "@fastcar/mysql-tool";
import * as path from "path";

//测试逆向生成
ReverseGen.generator({
 tables: ["test"],
 modelDir: path.join(__dirname, "../", "test", "model"),
 mapperDir: path.join(__dirname, "../", "test", "mapper"),
 dbConfig: {
  database: "test",
  user: "root",
  password: "123456",
  host: "localhost",
 },
 ignoreCamelcase: true,
 style: {
  tabWidth: 4,
  printWidth: 200,
  trailingComma: "es5",
  useTabs: true,
  parser: "typescript",
  endOfLine: "crlf", //文件结束符
 },
});
```

## 更多用法

参考项目git地址 @fastcar/mysql-tool/test 下的simple内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
