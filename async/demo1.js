
/**
1）内置执行器。

Generator 函数的执行必须靠执行器，所以才有了co模块，而async函数自带执行器。也就是说，
async函数的执行，与普通函数一模一样，只要一行。

（2）更好的语义。
async和await，比起星号和yield，语义更清楚了。
async表示函数里有异步操作，await表示紧跟在后面的表达式需要等待结果。

（3）更广的适用性。

co模块约定，yield命令后面只能是 Thunk 函数或 Promise 对象，而async函数的await命令后面，
可以是Promise 对象和原始类型的值（数值、字符串和布尔值，但这时等同于同步操作）。

（4）返回值是 Promise。

async函数的返回值是 Promise 对象，这比 Generator 函数的返回值是 Iterator 对象方便多了。
你可以用then方法指定下一步的操作。

进一步说，async函数完全可以看作多个异步操作，包装成的一个 Promise 对象，
而await命令就是内部then命令的语法糖。
*/
const fs = require('fs');

const readFile = function (fileName) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fileName, function(error, data) {
      if (error) return reject(error);
      resolve(data);
    });
  });
};

const asyncReadFile = async function () {
  var f1 = await readFile('./README1.md');
  var f2 = await readFile('./README2.md');
  console.log(f1.toString());
  console.log(f2.toString());
};
asyncReadFile();

/**
async函数的语法规则总体上比较简单，难点是错误处理机制。

返回 Promise 对象
async函数返回一个 Promise 对象。

async函数内部return语句返回的值，会成为then方法回调函数的参数。
*/
async function f() {
  return 'hello world';
}

f().then(v => console.log(v))   //hello world



/**
async函数内部抛出错误，会导致返回的 Promise 
对象变为reject状态。抛出的错误对象会被catch方法回调函数接收到。
*/
async function f2() {
  throw new Error('出错了');
}

f2().then(
  v => console.log(v)
  
).catch(
  e => console.log(e)
)

/**
await 命令
正常情况下，await命令后面是一个 Promise 对象。如果不是，会被转成一个立即resolve的 Promise 对象。

*/








