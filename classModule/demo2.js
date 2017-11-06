/**
构造函数的prototype属性，在 ES6 的“类”上面继续存在。事实上，类的所有方法都定义在类的prototype属性上面。
*/

class Point {
  constructor() {
    // ...
  }

  toString() {
    // ...
  }

  toValue() {
    // ...
  }
}

// 等同于

Point.prototype = {
  constructor() {},
  toString() {},
  toValue() {},
};

//在类的实例上面调用方法，其实就是调用原型上的方法。
class B {}
let b = new B();

b.constructor === B.prototype.constructor // true

//私有方法是常见需求，但 ES6 不提供，只能通过变通方法模拟实现。

//与私有方法一样，ES6 不支持私有属性。目前，有一个提案，为class加了私有属性。方法是在属性名之前，使用#表示。

/**
Class 的静态方法
类相当于实例的原型，所有在类中定义的方法，都会被实例继承。如果在一个方法前，加上static关键字，
就表示该方法不会被实例继承，而是直接通过类来调用，这就称为“静态方法”。
*/
class Foo {
  static classMethod() {
    return 'hello';
  }
}

Foo.classMethod() // 'hello'

var foo = new Foo();
foo.classMethod()
// TypeError: foo.classMethod is not a function



