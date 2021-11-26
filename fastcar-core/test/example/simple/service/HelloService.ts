import Service from '../../../../src/annotation/stereotype/Service';


@Service
class HelloService {

    say() {

        console.log("hello world");
    }
}

export default HelloService;