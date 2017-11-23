# react 15.6 源码学习
React 源码使用了大量的继承，依赖注入，Mixin，还有好多事务，看起来很吃力，下面简单总结一下

## 组件生命周期
组件生命周期是一种钩子函数，比如`componentWillMount`，`componentDidMount`在自定义元素组件`ReactCompositeComponent`的装载方法`mountComponent`中调用的，在渲染dom标记之前调用`componentWillMount`，渲染完dom标记之后调用`componentDidMount`
```javascript
if (inst.componentWillMount) {
  if (process.env.NODE_ENV !== 'production') {
    measureLifeCyclePerf(function () {
      return inst.componentWillMount();
    }, debugID, 'componentWillMount');
  } else {
    inst.componentWillMount();
  }
  // When mounting, calls to `setState` by `componentWillMount` will set
  // `this._pendingStateQueue` without triggering a re-render.
  if (this._pendingStateQueue) {
    inst.state = this._processPendingState(inst.props, inst.context);
  }
}
//...

if (inst.componentDidMount) {
  if (process.env.NODE_ENV !== 'production') {
    transaction.getReactMountReady().enqueue(function () {
      measureLifeCyclePerf(function () {
        return inst.componentDidMount();
      }, _this._debugID, 'componentDidMount');
    });
  } else {
    transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
  }
}

```
其他生命周期`componentWillReceiveProps` ,`shouldComponentUpdate`,`componentWillUpdate`,`componentDidUpdate`，`componentWillUnmount` 都是在`ReactCompositeComponent` 处理更新操作的不同阶段里调用的的.

## 单向数据流渲染（Data Flow）
React在createElement创建虚拟dom `ReactElement`的时候会把最外层的元素做type，里面的元素和属性全部当成children， ReactDOM.render的时候会递归渲染，从外往内部渲染，在渲染的时候，props和state自然就是在递归过程中往下传递。在触发state更新的时候，自定义元素`ReactCompositeComponent` 以及 html标签元素 `ReactDOMComponent` 在处理update都是采用递归更新操作， 所以是单向数据流

## 虚拟dom对象(Virtual DOM)
源码里叫 `ReactElement`，本质是一个object对象，通过React.createElement可以创建虚拟dom，jsx语法只是语法糖而已，最终babel编译完之后还是调用React.createElement方法。看下`ReactElement`的工厂方法：
```javascript
var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allow us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner
  };
  return element;
};

```
`ReactElement`是一个工厂方法不是构造函数，不能通过new创建虚拟dom对象，只能通过`ReactElement.createElement`创建，所以不要用instanceof检查一个对象是否是虚拟dom对象，要检测用`$$typeof`属性是否等于`Symbol.for('react.element')`：
```javascript
props.children[`$$typeof`] === Symbol.for('react.element')  
//如果为true 则props.children 是虚拟dom对象
```
`$$typeof`这个Symbol属性定义了React Element是一个唯一值，type属性是元素类型标签，key在dom diff算法的时候会用到

## Transaction
说道React中的事务，必须要看一下源码中的示意图：
```javascript
/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be run while it is already being run. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidUpdate` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM updates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
```
上面的形象的解释了React中的事务Transaction，React Transaction会给方法包装一个个wrapper，其中每个wrapper都有两个方法:initialize与close。当执行方法时，需要执行事务的perform方法。perform方法会首先一次执行wrapper的initialize，然后执行函数本身，最后执行wrapper的close方法。

下面举个例子，react在执行批量更新`batchedUpdates`的时候，这个方法被一个默认批量更新策略`ReactDefaultBatchingStrategy`包裹，这个策略其实是被事务包裹的:
```javascript

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function () {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  }
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

_assign(ReactDefaultBatchingStrategyTransaction.prototype, Transaction, {
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  }
});

var transaction = new ReactDefaultBatchingStrategyTransaction();
var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function (callback, a, b, c, d, e) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      return callback(a, b, c, d, e);
    } else {
      return transaction.perform(callback, null, a, b, c, d, e);
    }
  }
};
```
wrapper `RESET_BATCHED_UPDATES`负责在close阶段重置 `ReactDefaultBatchingStrategy`的 `isBatchingUpdates`为false。而wrapper `FLUSH_BATCHED_UPDATES`负责在close执行`flushBatchedUpdates`

React 中 更新state的入口方法 ***setState异步实现的机制就是通过包裹事务实现的***

## setState
这里就大致地说一下setState的异步流机制，***本质是通过事物Transaction实现的***,setState在`React.js`中的component类的原型上定义了抽象api，如果一个类的实例没有执行挂载方法`mountComponent`而直接调用setState是会报异常的（所以不能再constructor里调用setState，因为这个时候组件还没执行挂载方法，setState还没被注入：
```javascript
//ReactCompositeComponent.js
mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
    //...
    var updateQueue = transaction.getUpdateQueue();
    //....
    // These should be set up in the constructor, but as a convenience for
    // simpler class abstractions, we set them up after the fact.
    inst.props = publicProps;
    inst.context = publicContext;
    inst.refs = emptyObject;
    //这里正是注入 setState方法,setState是被事务包裹的
    inst.updater = updateQueue;

    this._instance = inst; 
  },

``` 
1. click事件触发；
2. React 内置事件监听器启动一个事务（transaction） ，把批策略（ReactDefaultBatchingStrategy）的批收集标志位置为 true；
3. 在事务的 perform 中，setState发起；
4. 触发更新器（updater）上的 enqueueSetState 和 enqueueCallback，把 state 和 callback 推入等待队列，并且驱动 enqueueUpdate 更新；
5. 触发 batchingStrategy 的 batchedUpdates 方法，启动一个事务，进行批收集；
6. 收集完成后，触发事务的 close 方法，复位标志位，并执行批处理；
7. 触发 ReactUpdates 的 flushBatchedUpdates 方法，启动另外一个事务，执行一系列的调用最终完成更新；
8. 更新完成后，触发事务的 close 方法，调用队列里的回调函数；
9. 最外层的事务完成，释放调用栈。 

简单的说，setState更新操作被若干个事务包裹起来了，而state的更新操作和回调操作会被塞入一个批处理队列中，而最后执行这个队列更新的方法是在另外一个事务里，事务包裹了好几层，所以setState更新操作是异步的。

## 事件处理

React事件系统还是相当麻烦的，主要分为事件注册，事件存储和事件执行三大部分。

React自己实现了一套高效的事件注册，存储，分发和重用逻辑，在DOM事件体系基础上做了很大改进，减少了内存消耗，简化了事件逻辑，并最大化的解决了IE等浏览器的不兼容问题。与DOM事件体系相比，它有如下特点

1. React组件上声明的事件最终绑定到了document这个DOM节点上，而不是React组件对应的DOM节点。故只有document这个节点上面才绑定了DOM原生事件，其他节点没有绑定事件。这样简化了DOM原生事件，减少了内存开销
2. React以队列的方式，从触发事件的组件向父组件回溯，调用它们在JSX中声明的callback。也就是React自身实现了一套事件冒泡机制。我们没办法用event.stopPropagation()来停止事件传播，应该使用event.preventDefault()
3. React有一套自己的合成事件SyntheticEvent，不同类型的事件会构造不同的SyntheticEvent
4. React使用对象池来管理合成事件对象的创建和销毁，这样减少了垃圾的生成和新对象内存的分配，大大提高了性能

React SyntheticEvent 合成事件 文档地址:

[https://reactjs.org/docs/events.html](https://reactjs.org/docs/events.html)

## 虚拟dom差异化算法（diff algorithm）
React component 的原型上定义了 `receiveComponent` 该方法会递归实现更新。
* 自定义组件`ReactCompositeComponent` 在执行更新的时候比较简单，首先会根据更新合并state和props得到新的虚拟dom `nextRenderedElement`，拿以前render得到的虚拟dom对象`prevRenderedElement` 与现在的虚拟dom对象 `nextRenderedElement`进行对比，对比方法叫`_shouldUpdateReactComponent`,如果要更新就继续调用对应的component类对应的receiveComponent，else 两次生成的element差别太大，就不是一个类型的，那好办直接重新生成一份新的代码重新渲染一次,***本质上还是递归调用receiveComponent的过程，递归到最后最终是更新DOM节点即执行ReactDOMComponent中的更新。***
* _shouldUpdateReactComponent是一个全局方法，这个是一种reactjs的优化机制。这个方法会判断虚拟dom的type是不是同一个type，虚拟dom里的key是不是同一个key ，如果都是同一个，则执行更新操作（自定义组件更新操作的本质就是重新生成虚拟dom），否则会`_instantiateReactComponent`重新生成新的component再挂载到页面，本质上还是递归
* html本身的dom组件`ReactDOMComponent`更新最复杂。这里的更新主要包括2部分：
    * 属性的更新，包括对特殊属性比如事件的处理。属性的更新主要就是找到以前老的不用的属性直接删除，新的属性赋值，并且注意其中特殊的事件属性做出特殊处理就行了。
    * `this._updateDOMChildren(lastProps, nextProps, transaction, context);` 子节点的更新是最复杂的,下面详细展开：

`ReactDOMComponent` 中的 更新方法 `_updateDOMChildren` 通过对比`lastProps`, `nextProps`来判断如何更新，具体的更新操作是通过下面这句话从`ReactMultiChild.js`中的Mixin混入的
```javascript
_assign(ReactDOMComponent.prototype, ReactDOMComponent.Mixin, ReactMultiChild.Mixin);
```
`ReactMultiChild.js`中定义了几种dom节点的操作 ：
```javascript
/**
更新标记并且插入原来位置
 * Make an update for markup to be rendered and inserted at a supplied index.
 *
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function makeInsertMarkup(markup, afterNode, toIndex) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'INSERT_MARKUP',
    content: markup,
    fromIndex: null,
    fromNode: null,
    toIndex: toIndex,
    afterNode: afterNode
  };
}

/**
把已经存在的标记移动到另外一个位置
 * Make an update for moving an existing element to another index.
 *
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function makeMove(child, afterNode, toIndex) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'MOVE_EXISTING',
    content: null,
    fromIndex: child._mountIndex,
    fromNode: ReactReconciler.getHostNode(child),
    toIndex: toIndex,
    afterNode: afterNode
  };
}

/**
删除节点标记
 * Make an update for removing an element at an index.
 *
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function makeRemove(child, node) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'REMOVE_NODE',
    content: null,
    fromIndex: child._mountIndex,
    fromNode: node,
    toIndex: null,
    afterNode: null
  };
}

/**
更新一个节点
 * Make an update for setting the markup of a node.
 *
 * @param {string} markup Markup that renders into an element.
 * @private
 */
function makeSetMarkup(markup) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'SET_MARKUP',
    content: markup,
    fromIndex: null,
    fromNode: null,
    toIndex: null,
    afterNode: null
  };
}

/**
更新文本内容
 * Make an update for setting the text content.
 *
 * @param {string} textContent Text content to set.
 * @private
 */
function makeTextContent(textContent) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'TEXT_CONTENT',
    content: textContent,
    fromIndex: null,
    fromNode: null,
    toIndex: null,
    afterNode: null
  };
}

```
更新该如何操作是在`DOMChildrenOperations.js`中定义具体的操作节点方法，直接操作DOM节点定义在`setInnerHTML.js`  `setTextContent.js`中。

