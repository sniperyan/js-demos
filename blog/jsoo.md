# js oo

## 最简单的oo实现
javascript虽然没有class的概念，但是它的函数却是可以new出来一个对象的。所以一个最简单的class就可以用function来模拟出来。
```javascript
function Animal(name) {
        this.name = name;
        this.run = function () {
            console.log(this.name + "is running!!");
        }
    }
var pet = new Animal("pet");
pet.run();//petis running!!
```
这样 pet就有了属性，有了方法，不过这种写法毫无继承性，扩展性。比如我们要实现个dog类，
只能把属性方法再写一遍。而且每个new出来的对象都有自己的方法，造成资源浪费。

## prototype
在javascript里面有个原型链的概念，每一个函数都有一个prototype对象属性。这样通过这个函数new出来的对象会自动具有__proto__属性指向函数的prototype对象。**`说白了所有的实例对象都会共用一个prototype对象，并且调用一个属性或者方法时在自己上面找不到，就会找__proto__对象有没有，之后一直往上追溯一直到找到为止`**。
```javascript
function Animal(name){
    this.name = name;
}
Animal.prototype.run = function(){
    console.log(this.name + "is running!!");
}
var a = new Animal("a");
var b = new Animal("b");
console.log(Animal.prototype) //Animal {} 
console.log(Animal.prototype instanceof Object) //true prototype是个对象
console.log(Animal.prototype.constructor == Animal)//true
console.log(a.__proto__ == Animal.prototype) //true __proto__在new的时候会自动加载在实例对象上。在现代浏览器里可以看到
console.log(b.__proto__ == Animal.prototype) //true
console.log(a.__proto__.__proto__) //Object {} 最后会找到最上面的boject对象
console.log(a.__proto__.run == a.run) //true
```
在prototype对象上定义的方法会被所有实例共享，这不就是复用吗？

## oo写法一：
子类的prototype指向父类的实例：
```javascript
function Animal(name){
    this.name = name;
}
Animal.prototype.run = function(){
    console.log(this.name + "is running!!");
}
function Dog(name){
    //调用父类的构造函数，通过改变this指向将属性赋值到新的实例对象
    Animal.call(this,name);
}
Dog.prototype = new Animal(); //Dog的prototype指向Animal的实例
var dog = new Dog("dog");
dog.run();//dog is running!!
```
> 如果在子类的prototype对象上也有run方法，就会覆盖父类的，因为查找时在自己上面就找到了，就不会向上回溯了。例如：
```javascript
function Animal(name){
    this.name = name;
}
Animal.prototype.run = function(){
    console.log(this.name + "is running!!");
}
function Dog(name){
    //调用父类的构造函数，通过改变this指向将属性赋值到新的实例对象
    Animal.call(this,name);
}
Dog.prototype = new Animal(); //Dog的prototype指向Animal的实例
Dog.prototype.run = function(){ //子类的prototype对象上也有run方法
    console.log("This is Dog.prototype.run!!");
}
var dog = new Dog("dog");
dog.run();//This is Dog.prototype.run!!
```
上面是原型链方法的继承。而属性我们则是通过调用父类的构造函数来赋值的。因为属性不能所有的实例都公用，应该每个人都有自己的一份，所以不能放在原型上。

**这种写法的问题会有2个问题：** 

1. 直接将父类实例作为子类的原型，简单粗暴造成多余的原型属性。dog对象的原型链上多了个name属性，值为undefined。执行new Animal()就会执行animal的构造函数，就会在Dog.prototype生成多余的属性值，这边是name。而一般属性值为了复用是不能放在原型对象上的。并且由于dog有自己的name属性，原型上的是多余的
```javascript
console.log(dog.__proto__)    // Animal {name: undefined}
```
2. 还有construct的问题。
```javascript
console.log(dog.constructor === Animal) // true
console.log(dog.constructor === Dog) // false
```

## oo写法二：
对上面方法一做些改良：
```javascript
function Animal(name) {
        this.name = name;
    }
Animal.prototype.run = function () {
        console.log(this.name + "is running!!");
    }
function Dog(name) {
        //调用父类的构造函数，通过改变this指向将属性赋值到新的实例对象
        Animal.call(this, name);
    }
Dog.prototype = Animal.prototype;
var dog = new Dog("dog");
dog.run();//dog is running!!

    
console.log(dog.__proto__)    // {run: ƒ, constructor: ƒ}
console.log(dog.constructor === Animal) // true
console.log(dog.constructor === Dog) // false
```
这种写法Dog.prototype上多余的属性没了，但是dog.constructor指向还是不正确

## oo写法三：
对上面做些改良：
```javascript
function Animal(name) {
    this.name = name;
}
Animal.prototype.run = function () {
    console.log(this.name + "is running!!");
}
function Dog(name) {
    //调用父类的构造函数，通过改变this指向将属性赋值到新的实例对象
    Animal.call(this, name);
}
var F = function () { }; //定义一个空的构造函数F
F.prototype = Animal.prototype; //F的原型指向Animal的原型
Dog.prototype = new F();//Dog的原型指向F的实例
Dog.prototype.constructor = Dog;  //Dog的constructor指向Dog
var dog = new Dog("dog");
dog.run();//dog is running!!


console.log(dog.__proto__)    // Animal {constructor: ƒ}
console.log(dog.constructor === Animal) // false
console.log(dog.constructor === Dog) // true
```
再封装一下：
```javascript
function objCreate(prototype) {
    var F = function () { };
    F.prototype = prototype;
    return new F();
}
function inherit(subclass, parentclass) {
    subclass.prototype = objCreate(parentclass.prototype);
    subclass.prototype.constructor = subclass;
}
function Animal(name) {
    this.name = name;
}
Animal.prototype.run = function () {
    console.log(this.name + "is running!!");
}
function Dog(name) {
    //调用父类的构造函数，通过改变this指向将属性赋值到新的实例对象
    Animal.call(this, name);
}
inherit(Dog, Animal);
var dog = new Dog("dog");
dog.run();//dog is running!!
console.log(dog.__proto__)    // Animal {constructor: ƒ}
console.log(dog.constructor == Animal) //false
console.log(dog.constructor == Dog) //true
```
这种方法是定义一个空的构造函数F，F的原型指向父类的原型，子类的原型指向父类的实例（解决了子类原型上多余属性的问题），最后再将子类的构造器指向自己

## oo写法四：
方法三使用起来还是很不便，比如需要自己手动维护在构造函数里调用父类构造函数。同时继承写法对不了接原理的比较容易出错。我们需要像传统oo一样具有一个类工厂，可以生成一个类，属性都定义在里面。同时具有继承的方法。现在有很多实现，比如支付宝的库阿拉蕾的实现，我觉得是最不错的一种方式：[https://github.com/aralejs/class/blob/master/class.js](https://github.com/aralejs/class/blob/master/class.js)

**万变不离其宗，本质上还是我们之前方法三的继承方式，只是在上面再封装一层，更加清晰，明白了。**

## oo写法五：
基本上，ES6 的class可以看作只是一个语法糖，它的绝大部分功能，ES5 都可以做到，新的class写法只是让对象原型的写法更加清晰、更像面向对象编程的语法而已。私有方法是常见需求，但 ES6 不提供，只能通过变通方法模拟实现。与私有方法一样，ES6 不支持私有属性。目前，有一个提案，为class加了私有属性。方法是在属性名之前，使用#表示。

## 参考：
[https://github.com/purplebamboo/blog/issues/14](https://github.com/purplebamboo/blog/issues/14)

[http://es6.ruanyifeng.com/#docs/class](http://es6.ruanyifeng.com/#docs/class)

