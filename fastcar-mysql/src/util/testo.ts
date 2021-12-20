abstract class Animal {
	abstract makeSound(): void;
}
class Dog extends Animal {
	makeSound(): void {
		console.log("woof");
	}
}
class Cat extends Animal {
	makeSound(): void {
		console.log("meow");
	}
}

function getAnimal(name: string): { new (): Animal } {
	if (name === "cat") return Cat;
	return Dog;
}

const getAnimalInstance = (name: string): Animal => {
	if (name === "cat") return new Cat();
	return new Dog();
};

console.log("sound:", new (getAnimal("dog"))().makeSound());
console.log("sound:", getAnimalInstance("cat").makeSound());
