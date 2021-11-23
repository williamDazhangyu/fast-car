import { Readonly, Deprecate } from '../base/decorators/Common';

describe('装饰器测试', () => {

  it("只读装饰器测试", () => {

    class TestModel {

      @Readonly
      info: string;

      @Readonly
      setInfo(s: string) {

        Reflect.defineProperty(this, "entree", {
          value: s
        });
      }
    }

    var m = new TestModel();
    m.setInfo("111");
    m.setInfo = ()=>{

    }
  });

  it("弃用装饰器测试", () => {

    @Deprecate()
    class TestModel {

      @Deprecate("hello is Deprecate")
      async hello() {

        return new Promise((resolve) => {

          resolve("hello is Deprecate");
        });
      }
    }

    new TestModel().hello().then((res) => {

      console.log(res);
    });
  });
});