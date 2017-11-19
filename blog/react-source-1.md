# react 源码分析-1
reactjs的核心内容并不多，主要是下面这些：
* 虚拟dom对象(Virtual DOM)
* 虚拟dom差异化算法（diff algorithm）
* 单向数据流渲染（Data Flow）
* 组件生命周期
* 事件处理

下面我们将一点点的来实现一个简易版的reactjs来理解reactjs的运行原理。（为了演示使用jquery库）

## 渲染文本节点
```javascript
<!DOCTYPE html>
<html>
<head>
    <script src="http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
</head>
<body>
    <div id="container"></div>
    <script type="text/javascript">
        //component类，用来表示文本在渲染，更新，删除时应该做些什么事情
        function ReactDOMTextComponent(text) {
            //存下当前的字符串
            this._currentElement = '' + text;
            //用来标识当前component
            this._rootNodeID = null;
        }
        //component渲染时生成的dom结构
        ReactDOMTextComponent.prototype.mountComponent = function (rootID) {
            this._rootNodeID = rootID;
            return '<span data-reactid="' + rootID + '">' + this._currentElement + '</span>';
        }
        //component工厂  用来返回一个component实例
        function instantiateReactComponent(node) {
            if (typeof node === 'string' || typeof node === 'number') {
                return new ReactDOMTextComponent(node)
            }
        }
        React = {
            nextReactRootIndex: 0,
            render: function (element, container) {

                var componentInstance = instantiateReactComponent(element);
                var markup = componentInstance.mountComponent(React.nextReactRootIndex++);
                $(container).html(markup);
                //触发完成mount的事件
                $(document).trigger('mountReady');
            }
        }
        React.render('hello world', document.getElementById("container"))
    </script>
</body>
</html>
```

代码分为三个部分：
1. React.render 作为入口负责调用渲染，参数为虚拟dom和挂载节点，reder主要分为3步：

    * 调用instantiateReactComponent生成component实例，instantiateReactComponent接收的参数正是虚拟dom
    * component原型上有原型方法mountComponent,执行该方法，生成对应的dom节点
    * 把上一步生成的dom节点塞入挂载的节点中

nextReactRootIndex作为每个component的标识id，不断加1，确保唯一性。这样我们以后可以通过这个标识找到这个元素。

2. 我们引入了component类的概念，ReactDOMTextComponent是一个component类定义，component原型上挂载了用于渲染节点的方法mountComponent
3. instantiateReactComponent用来根据element的类型（现在只有一种string类型），返回一个component的实例。其实就是个类工厂。

可以看到我们把逻辑分为几个部分，主要的渲染逻辑放在了具体的componet类去定义。React.render是负责调度整个流程的入口

## 渲染html基本元素
react使用React.createElement来创建一个虚拟dom元素。虚拟dom元素分为两种，一种是浏览器自带的基本元素比如 div p input form 这种，一种是自定义的元素。(上面文本节点，它不算虚拟dom，但是reacjs为了保持渲染的一致性。文本节点是在外面包了一层span标记，也给它配了个简化版component（ReactDOMTextComponent）)，下面是渲染html基本元素的例子，并且给节点绑定了事件

```javascript
<!DOCTYPE html>
<html>
<head>
    <script src="http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
</head>
<body>
    <div id="container"></div>
    <script type="text/javascript">
        //component类，用来表示文本在渲染，更新，删除时应该做些什么事情
        function ReactDOMTextComponent(text) {
            //存下当前的字符串
            this._currentElement = '' + text;
            //用来标识当前component
            this._rootNodeID = null;
        }
        //component渲染时生成的dom结构
        ReactDOMTextComponent.prototype.mountComponent = function (rootID) {
            this._rootNodeID = rootID;
            return '<span data-reactid="' + rootID + '">' + this._currentElement + '</span>';
        }
        //component类，用来表示文本在渲染，更新，删除时应该做些什么事情
        function ReactDOMComponent(element) {
            //存下当前的element对象引用
            this._currentElement = element;
            this._rootNodeID = null;
        }
        //component渲染时生成的dom结构
        ReactDOMComponent.prototype.mountComponent = function (rootID) {
            //赋值标识
            this._rootNodeID = rootID;
            var props = this._currentElement.props;
            var tagOpen = '<' + this._currentElement.type;
            var tagClose = '</' + this._currentElement.type + '>';

            //加上reactid标识
            tagOpen += ' data-reactid=' + this._rootNodeID;
            //拼凑出属性
            for (var propKey in props) {

                //这里要做一下事件的监听，就是从属性props里面解析拿出on开头的事件属性的对应事件监听
                if (/^on[A-Za-z]/.test(propKey)) {
                    var eventType = propKey.replace('on', '');
                    //针对当前的节点添加事件代理,以_rootNodeID为命名空间
                    $(document).delegate('[data-reactid="' + this._rootNodeID + '"]', eventType + '.' + this._rootNodeID, props[propKey]);
                }

                //对于children属性以及事件监听的属性不需要进行字符串拼接
                //事件会代理到全局。这边不能拼到dom上不然会产生原生的事件监听
                if (props[propKey] && propKey != 'children' && !/^on[A-Za-z]/.test(propKey)) {
                    tagOpen += ' ' + propKey + '=' + props[propKey];
                }
            }
            //获取子节点渲染出的内容
            var content = '';
            var children = props.children || [];

            var childrenInstances = []; //用于保存所有的子节点的componet实例，以后会用到
            var that = this;
            $.each(children, function (key, child) {
                //这里再次调用了instantiateReactComponent实例化子节点component类，拼接好返回
                var childComponentInstance = instantiateReactComponent(child);
                childComponentInstance._mountIndex = key;

                childrenInstances.push(childComponentInstance);
                //子节点的rootId是父节点的rootId加上新的key也就是顺序的值拼成的新值
                var curRootId = that._rootNodeID + '.' + key;
                //得到子节点的渲染内容
                var childMarkup = childComponentInstance.mountComponent(curRootId);
                //拼接在一起
                content += ' ' + childMarkup;

            })
            //留给以后更新时用的这边先不用管
            this._renderedChildren = childrenInstances;

            //拼出整个html内容
            return tagOpen + '>' + content + tagClose;
        }
        function instantiateReactComponent(node) {
            //文本节点的情况
            if (typeof node === 'string' || typeof node === 'number') {
                return new ReactDOMTextComponent(node);
            }
            //浏览器默认节点的情况
            if (typeof node === 'object' && typeof node.type === 'string') {
                //注意这里，使用了一种新的component
                return new ReactDOMComponent(node);

            }
        }
        //ReactElement就是虚拟dom的概念，具有一个type属性代表当前的节点类型，还有节点的属性props
        //比如对于div这样的节点type就是div，props就是那些attributes
        //另外这里的key,可以用来标识这个element，用于优化以后的更新，这里可以先不管，知道有这么个东西就好了
        function ReactElement(type, key, props) {
            this.type = type;
            this.key = key;
            this.props = props;
        }
        React = {
            nextReactRootIndex: 0,
            createElement: function (type, config, children) {
                var props = {}, propName;
                config = config || {}
                //看有没有key，用来标识element的类型，方便以后高效的更新，这里可以先不管
                var key = config.key || null;

                //复制config里的内容到props
                for (propName in config) {
                    if (config.hasOwnProperty(propName) && propName !== 'key') {
                        props[propName] = config[propName];
                    }
                }
                //处理children,全部挂载到props的children属性上
                //支持两种写法，如果只有一个参数，直接赋值给children，否则做合并处理
                var childrenLength = arguments.length - 2;
                if (childrenLength === 1) {
                    props.children = $.isArray(children) ? children : [children];
                } else if (childrenLength > 1) {
                    var childArray = Array(childrenLength);
                    for (var i = 0; i < childrenLength; i++) {
                        childArray[i] = arguments[i + 2];
                    }
                    props.children = childArray;
                }

                return new ReactElement(type, key, props);

            },
            render: function (element, container) {
                var componentInstance = instantiateReactComponent(element);
                var markup = componentInstance.mountComponent(React.nextReactRootIndex++);
                $(container).html(markup);
                //触发完成mount的事件
                $(document).trigger('mountReady');
            }
        }
        //演示事件监听怎么用
        function hello() {
            alert('hello')
        }
        var element = React.createElement('div', { id: 'test', onclick: hello }, 'click me')
        React.render(element, document.getElementById("container"))
    </script>
</body>
</html>
```

* 新增 `React.createElement`方法创建一个虚拟dom `ReactElement`
* instantiateReactComponent(element) 这个类工厂生产component增加了浏览器默认节点类`ReactDOMComponent`，其原型上也挂载了mountComponent方法用于渲染
* `ReactDOMComponent.prototype.mountComponent` 做了几件事
    * 在拼凑节点内容的时候根据`this._currentElement.type`来拼凑出html的标签类型
    * 遍历props对象里的key，正则判断key是不是`on...`开头，如果是的就把这个属性当成事件绑定到节点
    * 对于除children属性以及事件监听之外的属性进行字符串拼接，比如html里的`id='XX'`属性等
    * 遍历节点props里的children属性，每一个child再去调用`instantiateReactComponent(element)`去生成component，再调用`mountComponent`方法渲染生成dom结构，这里的child可以是一个虚拟dom，也可以是一个文本节点（react为了统一把文本节点也当做虚拟dom来处理），其实这里是一个 ***递归方法来渲染dom结构***

我们通过instantiateReactComponent屏蔽了子节点的差异，只需要使用不同的componet类，这样都能保证通过mountComponent最终拿到渲染后的内容。


## 渲染自定义元素
上面element.type只是浏览器元素的字符串，在react中自定义组件的话，那么这个element.type就不是简单的字符串了，而是一个类，这个类又具有自己的生命周期方法

```javascript
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8">
    <script src="http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>
</head>
<body>
    <div id="container"></div>
    <script type="text/javascript">
        //component类，用来表示文本在渲染，更新，删除时应该做些什么事情
        function ReactDOMTextComponent(text) {
            //存下当前的字符串
            this._currentElement = '' + text;
            //用来标识当前component
            this._rootNodeID = null;
        }
        //component渲染时生成的dom结构
        ReactDOMTextComponent.prototype.mountComponent = function (rootID) {
            this._rootNodeID = rootID;
            return '<span data-reactid="' + rootID + '">' + this._currentElement + '</span>';
        }
        //component类，用来表示文本在渲染，更新，删除时应该做些什么事情
        function ReactDOMComponent(element) {
            //存下当前的element对象引用
            this._currentElement = element;
            this._rootNodeID = null;
        }
        //component渲染时生成的dom结构
        ReactDOMComponent.prototype.mountComponent = function (rootID) {
            //赋值标识
            this._rootNodeID = rootID;
            var props = this._currentElement.props;
            var tagOpen = '<' + this._currentElement.type;
            var tagClose = '</' + this._currentElement.type + '>';
            //加上reactid标识
            tagOpen += ' data-reactid=' + this._rootNodeID;
            //拼凑出属性
            for (var propKey in props) {
                //这里要做一下事件的监听，就是从属性props里面解析拿出on开头的事件属性的对应事件监听
                if (/^on[A-Za-z]/.test(propKey)) {
                    var eventType = propKey.replace('on', '');
                    //针对当前的节点添加事件代理,以_rootNodeID为命名空间
                    $(document).delegate('[data-reactid="' + this._rootNodeID + '"]', eventType + '.' + this._rootNodeID, props[propKey]);
                }
                //对于children属性以及事件监听的属性不需要进行字符串拼接
                //事件会代理到全局。这边不能拼到dom上不然会产生原生的事件监听
                if (props[propKey] && propKey != 'children' && !/^on[A-Za-z]/.test(propKey)) {
                    tagOpen += ' ' + propKey + '=' + props[propKey];
                }
            }
            //获取子节点渲染出的内容
            var content = '';
            var children = props.children || [];
            var childrenInstances = []; //用于保存所有的子节点的componet实例，以后会用到
            var that = this;
            $.each(children, function (key, child) {
                //这里再次调用了instantiateReactComponent实例化子节点component类，拼接好返回
                var childComponentInstance = instantiateReactComponent(child);
                childComponentInstance._mountIndex = key;

                childrenInstances.push(childComponentInstance);
                //子节点的rootId是父节点的rootId加上新的key也就是顺序的值拼成的新值
                var curRootId = that._rootNodeID + '.' + key;
                //得到子节点的渲染内容
                var childMarkup = childComponentInstance.mountComponent(curRootId);
                //拼接在一起
                content += ' ' + childMarkup;

            })
            //留给以后更新时用的这边先不用管
            this._renderedChildren = childrenInstances;

            //拼出整个html内容
            return tagOpen + '>' + content + tagClose;
        }
        function ReactCompositeComponent(element) {
            //存放元素element对象
            this._currentElement = element;
            //存放唯一标识
            this._rootNodeID = null;
            //存放对应的ReactClass的实例
            this._instance = null;
        }
        //用于返回当前自定义元素渲染时应该返回的内容
        ReactCompositeComponent.prototype.mountComponent = function (rootID) {
            this._rootNodeID = rootID;
            //拿到当前元素对应的属性值
            var publicProps = this._currentElement.props;
            //拿到对应的ReactClass
            var ReactClass = this._currentElement.type;
            // Initialize the public class
            var inst = new ReactClass(publicProps);
            this._instance = inst;
            //保留对当前comonent的引用，下面更新会用到
            inst._reactInternalInstance = this;

            if (inst.componentWillMount) {
                inst.componentWillMount();
                //这里在原始的reactjs其实还有一层处理，就是  componentWillMount调用setstate，不会触发rerender而是自动提前合并，这里为了保持简单，就略去了
            }
            //调用ReactClass的实例的render方法,返回一个element或者一个文本节点
            var renderedElement = this._instance.render();
            //得到renderedElement对应的component类实例
            var renderedComponentInstance = instantiateReactComponent(renderedElement);
            this._renderedComponent = renderedComponentInstance; //存起来留作后用

            //拿到渲染之后的字符串内容，将当前的_rootNodeID传给render出的节点
            var renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

            //之前我们在React.render方法最后触发了mountReady事件，所以这里可以监听，在渲染完成后会触发。
            $(document).on('mountReady', function () {
                //调用inst.componentDidMount
                inst.componentDidMount && inst.componentDidMount();
            });

            return renderedMarkup;
        }
        function instantiateReactComponent(node) {
            //文本节点的情况
            if (typeof node === 'string' || typeof node === 'number') {
                return new ReactDOMTextComponent(node);
            }
            //浏览器默认节点的情况
            if (typeof node === 'object' && typeof node.type === 'string') {
                //注意这里，使用了一种新的component
                return new ReactDOMComponent(node);

            }
            //自定义的元素节点
            if (typeof node === 'object' && typeof node.type === 'function') {
                //注意这里，使用新的component,专门针对自定义元素
                return new ReactCompositeComponent(node);

            }
        }
        //ReactElement就是虚拟dom的概念，具有一个type属性代表当前的节点类型，还有节点的属性props
        //比如对于div这样的节点type就是div，props就是那些propibutes
        //另外这里的key,可以用来标识这个element，用于优化以后的更新，这里可以先不管，知道有这么个东西就好了
        function ReactElement(type, key, props) {
            this.type = type;
            this.key = key;
            this.props = props;
        }
        //定义ReactClass类,所有自定义的超级父类
        var ReactClass = function () {
        }
        //留给子类去继承覆盖
        ReactClass.prototype.render = function () { }
        React = {
            nextReactRootIndex: 0,
            createClass: function (spec) {
                //生成一个子类
                var Constructor = function (props) {
                    this.props = props;
                    this.state = this.getInitialState ? this.getInitialState() : null;
                }
                //原型继承，继承超级父类
                Constructor.prototype = new ReactClass();
                Constructor.prototype.constructor = Constructor;
                //混入spec到原型
                $.extend(Constructor.prototype, spec);
                return Constructor;

            },
            createElement: function (type, config, children) {
                var props = {}, propName;
                config = config || {}
                //看有没有key，用来标识element的类型，方便以后高效的更新，这里可以先不管
                var key = config.key || null;

                //复制config里的内容到props
                for (propName in config) {
                    if (config.hasOwnProperty(propName) && propName !== 'key') {
                        props[propName] = config[propName];
                    }
                }
                //处理children,全部挂载到props的children属性上
                //支持两种写法，如果只有一个参数，直接赋值给children，否则做合并处理
                var childrenLength = arguments.length - 2;
                if (childrenLength === 1) {
                    props.children = $.isArray(children) ? children : [children];
                } else if (childrenLength > 1) {
                    var childArray = Array(childrenLength);
                    for (var i = 0; i < childrenLength; i++) {
                        childArray[i] = arguments[i + 2];
                    }
                    props.children = childArray;
                }
                return new ReactElement(type, key, props);
            },
            render: function (element, container) {
                var componentInstance = instantiateReactComponent(element);
                var markup = componentInstance.mountComponent(React.nextReactRootIndex++);
                $(container).html(markup);
                //触发完成mount的事件
                $(document).trigger('mountReady');
            }
        }
        var HelloMessage = React.createClass({
            getInitialState: function () {
                return { type: 'say:' };
            },
            componentWillMount: function () {
                console.log('我就要开始渲染了。。。')
            },
            componentDidMount: function () {
                console.log('我已经渲染好了。。。')
            },
            render: function () {
                return React.createElement("div", null, this.state.type, "Hello ", this.props.name);
            }
        });
        React.render(React.createElement(HelloMessage, { name: "John" }), document.getElementById("container"));
    </script>
</body>
</html>
```

* 新增超级父类`ReactClass`，React.createElement接受的不再是字符串，而是一个class。
* 新增`React.createClass` 方法，该方法返回一个继承自ReactClass的子类，这个子类在构造函数里调用this.getInitialState获得最初的state，`React.createClass` 方法中的参数（getInitialState，componentWillMount，componentDidMount等等）都被混入到子类的原型中，`$.extend(Constructor.prototype, spec)`
* instantiateReactComponent(element) 这个类工厂生产component增加了自定义元素节点类`ReactCompositeComponent`，其原型上也挂载了mountComponent方法用于渲染。
* `ReactCompositeComponent.prototype.mountComponent` 做了几件事
    * this._currentElement.type 拿到class类，this._currentElement.props拿到props，调用`var inst = new ReactClass(publicProps);` 生成自定义元素实例，期间会执行ReactClass中的constructor的getInitialState，给实例添加了state属性
    * 实例化class得到inst对象之后，判断inst里是否定义了componentWillMount，如果定义了就执行该方法（生命周期就是在组件装载过程中挂载进来的钩子函数）
    * 调用inst里的render方法，得到一个虚拟dom `renderedElement`
    * 老规矩，递归渲染。先用`var renderedComponentInstance = instantiateReactComponent(renderedElement);`得到实例， 再` var renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);`得到渲染出的dom节点。
    * 监听`mountReady`事件，在回调里`inst.componentDidMount && inst.componentDidMount();`执行componentDidMount周期

## 总结
整个初次渲染的流程基本就分析完毕了。看看我们目前的进展，事件监听做了，虚拟dom有了。基本的组件生命周期也有了。
* component类有3种，`ReactDOMTextComponent`文本节点,`ReactDOMComponent`html元素节点,`ReactCompositeComponent`自定义节点。
* component类原型上都有`mountComponent`方法用于生成对应的html dom结构标记
* `ReactDOMTextComponent.prototype.mountComponent`比较简单，直接用span把text包起来返回
* `ReactDOMComponent.prototype.mountComponent`生成html dom结构标记，期间进行事件挂载，props的拼接，再把节点的虚拟dom 先`instantiateReactComponent`实例化再`mountComponent`递归渲染，最后把html 标记内容拼凑在一起
* `ReactCompositeComponent.prototype.mountComponent` 先实例化这个自定元素的类得到inst实例，执行钩子函数`componentWillMount()`，调用inst实例的render方法得到虚拟dom对象，再`instantiateReactComponent` `mountComponent` 进行递归渲染得到dom 结构标记，监听 `mountReady`事件，在这个回调里执行钩子函数 `componentDidMount`
* `instantiateReactComponent`是component工厂方法，负责把传进来的虚拟dom对象生成对应的component实例
* `ReactElement`就是虚拟dom的构造函数，jsx语法糖转换之后就是`React.createElement`方法，该方法生成虚拟dom对象的实例
* `ReactClass`超级父类，`React.createClass`生成继承自超级父类的子类，把自定义元素`React.createClass`中定义的方法挂载到子类的原型上
* React.render 作为入口负责调用渲染，先把虚拟dom执行工厂方法生成component实例，再执行mountComponent挂载方法得到html dom标记，最后再插入到html中。而自定义元素的render方法是在ReactCompositeComponent类的挂载方法中执行，生成对应的component再执行挂载方法

参考: [https://github.com/purplebamboo/blog/issues/2](https://github.com/purplebamboo/blog/issues/2)


