# react 15.6 源码学习
上文大概说了一下装载和更新的流程，下面详细解读一下

## setState
api如下
```javascript
setState(updater[, callback])
```
setState会把组件的state变化push到一个数组里（源码里叫queue），然后react会重新渲染这些变化，这是一个基础的方法入口用于更新，这个方法不会立即调用更新，可以理解为一个请求，callback作为回调函数，会在更新结束之后执行。

React库中 `ReactBaseClasses.js` 定义了component类：
```javascript
/**
 * Base class helpers for the updating state of a component.
 */
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}
```
React库中 `ReactBaseClasses.js` 定义了setState的抽象api:
```javascript
ReactComponent.prototype.setState = function (partialState, callback) {
  //忽略 type checker
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'setState');
  }
};
```
`ReactNoopUpdateQueue.enqueueSetState` 实际是没有什么意义的,在非生产版本中警告(warning),真正的updater是在renderer中注入(inject)的。`ReactCompositeComponent.js`中装载方法`mountComponent` 有这么一句：
```javascript
var updateQueue = transaction.getUpdateQueue();
//....
// 注入updater
inst.updater = updateQueue;
```
其实是调用ReactUpdateQueue中的enqueueSetState，看下实现:
```javascript
/**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState) {

    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'setState');

    if (!internalInstance) {
      return;
    }

    var queue = internalInstance._pendingStateQueue || (internalInstance._pendingStateQueue = []);
    queue.push(partialState);

    enqueueUpdate(internalInstance);
  },

```
通过执行函数:
```javascript
var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'setState');
```
我们得到的internalInstance实质就是组件实例的React内部表达，包含了组件实例的内部的一些属性,internalInstance的属性很多，但我们需要关注的只有两个:_pendingStateQueue(待更新队列)与_pendingCallbacks(更新回调队列)。根据代码
```javascript
var queue = internalInstance._pendingStateQueue || (internalInstance._pendingStateQueue = []);
    queue.push(partialState);
```
如果待更新队列为空，就复制空数组，把state塞进去，最后调用`enqueueUpdate(internalInstance)`,下面看一下这个方法，
```javascript
function enqueueUpdate(internalInstance) {
  ReactUpdates.enqueueUpdate(internalInstance);
}

//ReactUpdates.js
function enqueueUpdate(component) {
  ensureInjected();

  // Various parts of our code (such as ReactCompositeComponent's
  // _renderValidatedComponent) assume that calls to render aren't nested;
  // verify that that's the case. (This is called by each top-level update
  // function, like setState, forceUpdate, etc.; creation and
  // destruction of top-level components is guarded in ReactMount.)

  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }

  dirtyComponents.push(component);
  if (component._updateBatchNumber == null) {
    component._updateBatchNumber = updateBatchNumber + 1;
  }
}

```
首先执行的ensureInjected()其实也是一个保证ReactUpdates.ReactReconcileTransaction与batchingStrategy是否存在，否则给出相应的警告，当然上面两个的作用之后会给出。接下来会根据batchingStrategy.isBatchingUpdates的值做出不同的行为,如果是true的话，直接将internalInstance放入dirtyComponents，否则将执行batchingStrategy.batchedUpdates(enqueueUpdate, component)。那么我们要了解一下batchingStrategy是干什么的。
```javascript
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
        //alreadyBatchingUpdates 为flase,没有执行批量更新
      return transaction.perform(callback, null, a, b, c, d, e);
    }
  }
};

```
batchingStrategy实质上就是批量更新策略，其属性isBatchingUpdates表示的是否处于批量更新的过程中，开始默认值为false。batchedUpdates就是执行批量更新的方法。当isBatchingUpdates为false时，执行transaction.perform(callback, null, a, b, c, d, e)。否则当isBatchingUpdates为true时，直接执行callback。

批量更新就得看React中的事务Transaction,React Transaction会给方法包装一个个wrapper，其中每个wrapper都有两个方法:initialize与close。当执行方法时，需要执行事务的perform方法。perform方法会首先一次执行wrapper的initialize，然后执行函数本身，最后执行wrapper的close方法。(见Transaction.js)

看下`ReactDefaultBatchingStrategy`中的`transaction`是如何定义的:
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

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

_assign(ReactDefaultBatchingStrategyTransaction.prototype, Transaction, {
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  }
});

var transaction = new ReactDefaultBatchingStrategyTransaction();
```
其中wrapper `RESET_BATCHED_UPDATES`负责在close阶段重置`ReactDefaultBatchingStrategy`的isBatchingUpdates为false。而wrapper `FLUSH_BATCHED_UPDATES`负责在close执行flushBatchedUpdates。

`ReactUpdates.js`
```javascript
var flushBatchedUpdates = function () {
  // ReactUpdatesFlushTransaction's wrappers will clear the dirtyComponents
  // array and perform any updates enqueued by mount-ready handlers (i.e.,
  // componentDidUpdate) but we need to check here too in order to catch
  // updates enqueued by setState callbacks and asap calls.
  while (dirtyComponents.length || asapEnqueued) {
    if (dirtyComponents.length) {
      var transaction = ReactUpdatesFlushTransaction.getPooled();
      transaction.perform(runBatchedUpdates, null, transaction);
      ReactUpdatesFlushTransaction.release(transaction);
    }

    if (asapEnqueued) {
      asapEnqueued = false;
      var queue = asapCallbackQueue;
      asapCallbackQueue = CallbackQueue.getPooled();
      queue.notifyAll();
      CallbackQueue.release(queue);
    }
  }
};

```
我们发现在函数flushBatchedUpdates中是以事务ReactUpdatesFlushTransaction的方式执行了函数runBatchedUpdates，追根溯源我们来看看runBatchedUpdates干了什么。

```javascript
function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength;

  // Since reconciling a component higher in the owner hierarchy usually (not
  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
  // them before their children by sorting the array.
  dirtyComponents.sort(mountOrderComparator);

  // Any updates enqueued while reconciling must be performed after this entire
  // batch. Otherwise, if dirtyComponents is [A, B] where A has children B and
  // C, B could update twice in a single batch if C's render enqueues an update
  // to B (since B would have already updated, we should skip it, and the only
  // way we can know to do so is by checking the batch counter).
  updateBatchNumber++;

  for (var i = 0; i < len; i++) {
    // If a component is unmounted before pending changes apply, it will still
    // be here, but we assume that it has cleared its _pendingCallbacks and
    // that performUpdateIfNecessary is a noop.
    var component = dirtyComponents[i];

    // If performUpdateIfNecessary happens to enqueue any new updates, we
    // shouldn't execute the callbacks until the next render happens, so
    // stash the callbacks first
    var callbacks = component._pendingCallbacks;
    component._pendingCallbacks = null;

    var markerName;
    if (ReactFeatureFlags.logTopLevelRenders) {
      var namedComponent = component;
      // Duck type TopLevelWrapper. This is probably always true.
      if (component._currentElement.type.isReactTopLevelWrapper) {
        namedComponent = component._renderedComponent;
      }
      markerName = 'React update: ' + namedComponent.getName();
      console.time(markerName);
    }

    ReactReconciler.performUpdateIfNecessary(component, transaction.reconcileTransaction, updateBatchNumber);

    if (markerName) {
      console.timeEnd(markerName);
    }

    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(callbacks[j], component.getPublicInstance());
      }
    }
  }
}

```
首先函数将dirtyComponents以组件中的_mountOrder进行了递增排序，其目的就是保证更新顺序，即父组件保证其子组件之前更新。然后在组件中获得setState完成之后的回调函数，开始执行ReactReconciler.performUpdateIfNecessary。又得看看这个函数。。。

## 总结
这里就大致地还原一下setState的异步流机制，***本质是通过事物Transaction实现的***
1. click事件触发；
2. React 内置事件监听器启动一个事务（transaction） ，把批策略（ReactDefaultBatchingStrategy）的批收集标志位置为 true；
3. 在事务的 perform 中，setState发起；
4. 触发更新器（updater）上的 enqueueSetState 和 enqueueCallback，把 state 和 callback 推入等待队列，并且驱动 enqueueUpdate 更新；
5. 触发 batchingStrategy 的 batchedUpdates 方法，启动一个事务，进行批收集；
6. 收集完成后，触发事务的 close 方法，复位标志位，并执行批处理；
7. 触发 ReactUpdates 的 flushBatchedUpdates 方法，启动另外一个事务，执行一系列的调用最终完成更新；
8. 更新完成后，触发事务的 close 方法，调用队列里的回调函数；
9. 最外层的事务完成，释放调用栈。 

参考: 

[https://juejin.im/post/599b8f066fb9a0247637d61b](https://juejin.im/post/599b8f066fb9a0247637d61b)

[http://www.jianshu.com/p/31985ddd196a](http://www.jianshu.com/p/31985ddd196a)

