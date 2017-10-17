#!/usr/bin/env node
'use strict';
const chalk = require('chalk');
const options = require('minimist')(process.argv.slice(2));
const commands = options._;  //[arg1,arg2]

console.log('this is result')

/**
 * node 和 shell互相调用案例
 * 之前写过shell 与java互相调用也是如此
 * 只是node的输出返回shell脚本的方法是console.log()而java 是System.out.print
 * 
 */