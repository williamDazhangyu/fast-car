# 基于@fastcar/core框架下的 mysql 逆向生成工具

## 快速安装

npm install @fastcar/mysql-tool

## 实例

```ts
import { ReverseGenerate } from "@fastcar/mysql-tool";
import * as path from "path";

let basePath = path.join(__dirname, "../", "src");
let modelPath = path.join(basePath, "model");
let mapperPath = path.join(basePath, "mapper");

describe("逆向生成工具", () => {
 it("逆向生成", async () => {
  ReverseGenerate.generator(["table_example"], modelPath, mapperPath, {
   database: "database_example",
   user: "root",
   password: "123456",
   host: "localhost",
  });
 });
});
```

## 更多用法

参考项目git地址 @fastcar/mysql-tool/test 下的simple内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
