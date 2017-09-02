/**
require的使用非常简单，它相当于module.exports的传送门，module.exports后面的内容是什么，
require的结果就是什么，对象、数字、字符串、函数……再把require的结果赋值给某个变量，
相当于把require和module.exports进行平行空间的位置重叠。
而且require理论上可以运用在代码的任何地方，甚至不需要赋值给某个变量之后再使用，比如：
*/
require('./a')(); // a模块是一个函数，立即执行a模块函数
var data = require('./a').data; // a模块导出的是一个对象
var a = require('./a')[0]; // a模块导出的是一个数组
//你在使用时，完全可以忽略模块化这个概念来使用require，仅仅把它当做一个node内置的全局函数，它的参数甚至可以是表达式：
require(process.cwd() + '/a');

/**
但是import则不同，它是编译时的（require是运行时的），它必须放在文件开头，而且使用格式也是确定的，不容置疑。
它不会将整个模块运行后赋值给某个变量，而是只选择import的接口进行编译，这样在性能上比require好很多。

从理解上，require是赋值过程，import是解构过程，当然，require也可以将结果解构赋值给一组变量，
但是import在遇到default时，和require则完全不同：var $ = require('jquery');和import $ from 'jquery'是完全不同的两种概念。

上面完全没有回答“改用require还是import？”这个问题，因为这个问题就目前而言，根本没法回答，
因为目前所有的引擎都还没有实现import，我们在node中使用babel支持ES6，也仅仅是将ES6转码为ES5再执行，
import语法会被转码为require。这也是为什么在模块导出时使用module.exports，
在引入模块时使用import仍然起效，因为本质上，import会被转码为require去执行。

但是，我们要知道这样一个道理，ES7很快也会发布，js引擎们会尽快实现ES6标准的规定，
如果一个引擎连标准都实现不了，就会被淘汰，ES6是迟早的事。如果你现在仍然在代码中部署require，
那么等到ES6被引擎支持时，你必须升级你的代码，而如果现在开始部署import，那么未来可能只需要做很少的改动。
*/