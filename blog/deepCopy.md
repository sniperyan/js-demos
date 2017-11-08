# js 浅拷贝与深拷贝

首先深复制和浅复制只针对像 Object, Array 这样的复杂对象的。简单来说，浅复制只复制一层对象的属性，而深复制则递归复制了所有层级。需要注意的是，如果对象比较大，层级也比较多，深复制会带来性能上的问题。在遇到需要采用深复制的场景时，可以考虑有没有其他替代的方案。在实际的应用场景中，也是浅复制更为常用。

## 浅拷贝一
```javascript
function t (a,arr){
    this.a = a;
    this.arr = arr
}
t.prototype.func = function(){
    console.log('just test')
}

function shallowCopy(src) {
    var dst = {};
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            dst[prop] = src[prop];
        }
    }
    return dst;
}
var obj = new t(1,[2,3,{'ran':[1,2,3]}]);
var copy1 = shallowCopy(obj)
var copy2 = shallowCopy(obj)
console.log(copy1 ===copy2) //false
console.log(copy1.arr ===copy2.arr) //true
//这就是浅拷贝

```
因为浅复制只会将对象的各个属性进行依次复制，并不会进行递归复制，而 JavaScript 存储对象都是存地址的，所以浅复制会导致 copy1.arr 和 copy2.arr 指向同一块内存地址

## 浅拷贝二
```javascript
var copy3 = {...obj}
var copy4 = {...obj}
console.log(copy3 ===copy4) //false
console.log(copy3.arr ===copy4.arr) //true
```

## 浅拷贝三
```javascript
var copy5 = Object.assign({},obj);
var copy6 = Object.assign({},obj);
console.log(copy5 ===copy6) //false
console.log(copy5.arr ===copy6.arr) //true
```
所以`Object.assign` 执行的是浅拷贝

## 深拷贝一
```javascript
var copy7 = JSON.parse( JSON.stringify(obj) );
var copy8 = JSON.parse( JSON.stringify(obj) );
console.log(copy7 ===copy8) //false
console.log(copy7.arr ===copy8.arr) //false
console.log(copy7.arr[2].ran ===copy8.arr[2].ran) //false
```
这是用json序列化实现的深拷贝，很简单


## 丢失原型链
```javascript
console.log(obj.func)
console.log(copy1.func) //undefined
console.log(copy2.func) //undefined
console.log(copy3.func) //undefined
console.log(copy4.func) //undefined
console.log(copy5.func) //undefined
console.log(copy6.func) //undefined
console.log(copy7.func) //undefined
console.log(copy8.func) //undefined
```
说明上面不仅浅拷贝丢失了原型链，json序列化与反序列化也丢失了原型链

## 递归深拷贝
```javascript
var cloneDeep = function(obj){
    var newobj = obj.constructor === Array ? [] : {};
    if(typeof obj !== 'object'){
        return obj;
    } else {
        for(var i in obj){
            newobj[i] = typeof obj[i] === 'object' ? 
            cloneDeep(obj[i]) : obj[i]; 
        }
    }
    return newobj;
};

var copy9 =cloneDeep(obj)
var copy10 =cloneDeep(obj)
console.log(copy9 ===copy10) //false
console.log(copy9.arr ===copy10.arr) //false
console.log(copy9.arr[2].ran ===copy10.arr[2].ran) //false
console.log(copy9.func) //f
console.log(copy10.func) //f
```
for in 可以遍历对象中所有可枚举的对象属性(包括对象自有属性和继承的属性)，会枚举原型链上的属性，通过递归可以进行深拷贝，原型链上的属性也被拷贝了，但是递归很消耗性能，使用的时候需要小心


