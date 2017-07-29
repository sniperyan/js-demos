/**
 * fs.readFile(fileA, function (err, data) {
 *       fs.readFile(fileB, function (err, data) {
 *       // ...
 *       });
 *  });
 *  如果依次读取多个文件，就会出现多重嵌套
 *
 *  使用了 readfilePpromise ,它的作用就是返回一个 Promise 版本的 readFile 函数
 *
 *  可以这么写：
 *  readfilePpromise(fileA)
 *       .then(function(data){
 *       console.log(data.toString());
 *   })
 *       .then(function(){
 *       return readFile(fileB);
 *   })
 *       .then(function(data){
 *       console.log(data.toString());
 *   })
 *       .catch(function(err) {
 *       console.log(err);
 *   });
 *
 */

const fs = require('fs');
var readfilePpromise = function (filePath, options) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, options, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

readfilePpromise('./demo1.html').then((data) => {
    console.log(data.toString())
}).then(()=>{
    return readfilePpromise('./demo12.html')
}).then((data)=>{
    console.log(data.toString())
}).catch((err)=>{
    console.log(err)
})





