/**
子类必须在constructor方法中调用super方法，否则新建实例时会报错。
这是因为子类没有自己的this对象，而是继承父类的this对象，然后对其进行加工。
如果不调用super方法，子类就得不到this对象。
*/

class Point { /* ... */ }

class ColorPoint extends Point {
  constructor() {
  }
}

let cp = new ColorPoint(); // ReferenceError

/**
ES5 的继承，实质是先创造子类的实例对象this，然后再将父类的方法添加到this上面（Parent.apply(this)）。
ES6 的继承机制完全不同，实质是先创造父类的实例对象this（所以必须先调用super方法），
然后再用子类的构造函数修改this。
*/

