// 要引入这个库
import { Autowired, Controller } from "../base/decorators/Aop";
import "reflect-metadata";

describe('装饰器元数据测试', () => {

    it("元数据测试案例", () => {

        @Reflect.metadata('sname', 'Person')
        @Controller
        class Person {

            @Autowired
            childPro: string;

            @Reflect.metadata('words', 'hello world')
            public speak(): string {
                return 'hello world'
            }
        }

        console.log(Reflect.getMetadata('CONTROLLER', new Person()));
        // console.log(Reflect.getMetadata('sname', Person)) // 'Person'
        // console.log(Reflect.getMetadata('words', new Person(), 'speak')) // 'hello world'
    })
})