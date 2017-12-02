# javascript组件化
比如我们要实现这样一个组件，就是一个输入框里面字数的计数。

## 入门级写法
所谓的入门级写法呢，就是完完全全的全局函数全局变量的写法。
```javascript
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>test</title>
  <script src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
  <script>
    $(function() {

      var input = $('#J_input');

      //用来获取字数
      function getNum(){
        return input.val().length;
      }

      //渲染元素
      function render(){
        var num = getNum();

        //没有字数的容器就新建一个
        if ($('#J_input_count').length == 0) {
          input.after('<span id="J_input_count"></span>');
        };

        $('#J_input_count').html(num+'个字');
      }

      //监听事件
      input.on('keyup',function(){
        render();
      });

      //初始化，第一次渲染
      render();


    })
  </script>
</head>
<body>
<input type="text" id="J_input"/>
</body>
</html>
```
> 这种写法的问题：各种变量混乱，没有很好的隔离作用域,当页面变的复杂的时候,会很难去维护。目前这种代码基本是用不了的。当然少数的活动页面可以简单用用。

## 作用域隔离
让我们对上面的代码作些改动，使用单个变量模拟命名空间。
```javascript
var textCount = {
  input:null,
  init:function(config){
    this.input = $(config.id);
    this.bind();
    //这边范围对应的对象，可以实现链式调用
    return this;
  },
  bind:function(){
    var self = this;
    this.input.on('keyup',function(){
      self.render();
    });
  },
  getNum:function(){
    return this.input.val().length;
  },
  //渲染元素
  render:function(){
    var num = this.getNum();

    if ($('#J_input_count').length == 0) {
      this.input.after('<span id="J_input_count"></span>');
    };

    $('#J_input_count').html(num+'个字');
  }
}

$(function() {
  //在domready后调用
  textCount.init({id:'#J_input'}).render();
})
```
这样一改造，立马变的清晰了很多，所有的功能都在一个变量下面。代码更清晰，并且有统一的入口调用方法。
> 这种写法的问题：这种写法没有私有的概念，比如上面的getNum,bind应该都是私有的方法。但是其他代码可以很随意的改动这些。当代码量特别特别多的时候，很容易出现变量重复，或被修改的问题。

## 闭包立即执行
```javascript
var TextCount = (function(){
  //私有方法，外面将访问不到
  var _bind = function(that){
    that.input.on('keyup',function(){
      that.render();
    });
  }

  var _getNum = function(that){
    return that.input.val().length;
  }

  var TextCountFun = function(config){

  }

  TextCountFun.prototype.init = function(config) {
    this.input = $(config.id);
    _bind(this);

    return this;
  };

  TextCountFun.prototype.render = function() {
    var num = _getNum(this);

    if ($('#J_input_count').length == 0) {
      this.input.after('<span id="J_input_count"></span>');
    };

    $('#J_input_count').html(num+'个字');
  };
  //返回构造函数
  return TextCountFun;

})();

$(function() {
  new TextCount().init({id:'#J_input'}).render();
})
```
这种写法，把所有的东西都包在了一个自动执行的闭包里面，所以不会受到外面的影响，并且只对外公开了TextCountFun构造函数，生成的对象只能访问到init,render方法。这种写法已经满足绝大多数的需求了。事实上大部分的jQuery插件都是这种写法。

`TextCountFun`原型上挂载方法`init` ，`init`里面返回this即init函数执行完毕会返回构造函数自身，这样可以实现链式调用

## 参考
[https://github.com/purplebamboo/blog/issues/16](https://github.com/purplebamboo/blog/issues/16)
