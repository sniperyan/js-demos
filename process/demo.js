/**
 * process对象是 Node 的一个全局对象，提供当前 Node 进程的信息。
 * 它可以在脚本的任意位置使用，不必通过require命令加载。该对象部署了EventEmitter接口
 */

//process.argv：返回一个数组，成员是当前进程的所有命令行参数
//node xx.js t1 t2
console.log(process.argv)
console.log(process.argv.slice(2))  // 取后面参数

//process.env：返回一个对象，成员为当前Shell的环境变量，比如process.env.HOME。
console.log(process.env)
console.log(process.env.NODE_ENV)


//process.pid：返回一个数字，表示当前进程的进程号。
console.log(process.pid)

//process.platform：返回一个字符串，表示当前的操作系统，比如Linux。
console.log(process.platform)

//process.title：返回一个字符串，默认值为node，可以自定义该值。
console.log(process.title)

//process.version：返回一个字符串，表示当前使用的 Node 版本，比如v7.10.0。
console.log(process.version)

/**
 *
 * process.exit([code]) code <integer> 结束状态码。默认为0。
 * 它可以接受一个数值参数，如果参数大于0，表示执行失败；如果等于0表示执行成功。
 *
 */
process.exit(1);