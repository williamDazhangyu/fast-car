import { EnableForm, EnableParseMap, NotNull, Size, ValidForm } from "../base/decorators/FormValidation";

describe('表单校验测试', () => {

    it("表单注解于方法上测试", () => {

        //做成一个符合型的
        type UserInfo = {

            name?: string,
            age?: number
        };

        class AA {

            constructor() {

            }

            @EnableForm  //开启表单
            async func(
                @NotNull({ prop: "name" })
                @Size({ prop: "name", max: 100 })
                hello: UserInfo) {

                console.log(this, hello);
                return "哈哈哈哈";
            }

            /**
             * 
             * @param hello 
             * @param hello2 
             * @returns 
             */
            @EnableParseMap
            func2(hello: string, hello2: string = "2") {

                console.log(this, hello, hello2);
                return true;
            }

            @ValidForm({
                "name": { required: false, type: "string", minSize: 2 }
            })
            async func3(hello: UserInfo) {

                console.log(hello.name);
            }
        }

        let testa = new AA();
        testa.func({ name: "zjx" }).then((res) => {

            console.log("res----", res);
        }).catch((err: Error) => {

            console.log(err.message);
        });

        Reflect.apply(testa.func2, testa, [{ "hello": 1, "hello2": 100 }]);
        testa.func3({}).then(() => {

        }).catch((err) => {

            console.log(err);
        });
    });
});