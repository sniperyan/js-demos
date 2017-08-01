var path = require('path');

/**
 * __dirname: 总是返回被执行的 js 所在文件夹的绝对路径
 * __filename: 总是返回被执行的 js 的绝对路径
 * process.cwd(): 总是返回运行 node 命令时所在的文件夹的绝对路径
 * ./ 的路径需要区分，在require()里是绝对路径，和__dirname相同，但是其他情况下和process.cwd()相同是相对路径
 */
console.log(__dirname) // 绝对路径
console.log(__filename) // 绝对路径
console.log(process.cwd()) // 绝对路径

//   ./为相对路径，可以使用path.resolve('./')来转换为绝对路径
console.log(path.resolve('./'))


/**
 * 先在path目录下执行 node demo.js正确
 * 退到js-demos目录下执行 node path/demo.js 报错
 * 从运行结果可以看出 require('./test') 是 OK 的，只是 readFile 时报错了
 *
 * 那么关于 ./ 正确的结论是：
 *  在 require() 中使用是跟 __dirname 的效果相同，不会因为启动脚本的目录不一样而改变，
 *  在其他情况下跟 process.cwd() 效果相同，是相对于启动脚本所在目录的路径。
 *
 *
 *  只有在 require() 时才使用相对路径(./, ../) 的写法，其他地方一律使用绝对路径
 *
 *  改成 path.join(__dirname,'test.js') 没问题
 *  或者 path.resolve(__dirname, './test.js')
 */

var fs = require('fs');
var common = require('./test');
fs.readFile('./test.js', function (err, data) {
    if (err) return console.log(err);
    console.log(data.toString());
});

