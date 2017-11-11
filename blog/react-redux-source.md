# react-redux 源码分析
react-redux是一个轻量级的封装库，核心方法只有两个：
* Provider
* connect

下面我们来逐个分析其作用
## Provider
Provider模块的功能并不复杂，主要分为以下两点：
* 在原应用组件上包裹一层，使原来整个应用成为Provider的子组件
* 接收Redux的store作为props，通过context对象传递给子孙组件上的connect
```javascript
export default class Provider extends Component {
  getChildContext() {
    return { store: this.store }
  }

  constructor(props, context) {
    super(props, context)
    this.store = props.store
  }

  render() {
    return Children.only(this.props.children)
    //Verifies that children has only one child (a React element) and returns it. 
  }
}

if (process.env.NODE_ENV !== 'production') {
  Provider.prototype.componentWillReceiveProps = function (nextProps) {
    const { store } = this
    const { store: nextStore } = nextProps

    if (store !== nextStore) {
      warnAboutReceivingStore()
    }
  }
}

Provider.propTypes = {
  store: storeShape.isRequired,
  children: PropTypes.element.isRequired
}
Provider.childContextTypes = {
  store: storeShape.isRequired
}
```
### 封装原应用
* render方法中，渲染了其子级元素，使整个应用成为Provider的子组件
* Children.only用于获取仅有的一个子组件，没有或超过一个均会报错。故需要注意：确保Provider组件的直接子级为单个封闭元素，切勿多个组件平行放置。
### 传递store
* Provider初始化时，获取到props中的store对象，将外部的store对象放入context对象中，使子孙组件上的connect可以直接访问到context对象中的store。
### 小结
总而言之，Provider模块的功能很简单，从最外部封装了整个应用，并向connect模块传递store。
而最核心的功能在connect模块中。

## connect
connect模块是真正连接了React和Redux，这是一个高阶函数。连接操作不会改变原来的组件类，反而返回一个新的与 Redux store 连接的组件类，该React组件中注入了state和action creator，达到增强的目的

connect完整函数声明如下：
```javascript
connect(
    mapStateToProps(state,ownProps)=>stateProps:Object, 
    mapDispatchToProps(dispatch, ownProps)=>dispatchProps:Object, 
    mergeProps(stateProps, dispatchProps, ownProps)=>props:Object,
    options:Object
)=>(
    component
)=>component
```
再来看下connect函数体结构，我们摘取核心步骤进行描述:
```javascript
export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  //参数处理...
  const { pure = true, withRef = false } = options
  return function wrapWithConnect(WrappedComponent) {
    class Connect extends Component {
      shouldComponentUpdate() {
        return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged
      }

      constructor(props, context) {
        super(props, context)
        this.version = version
        this.store = props.store || context.store
        const storeState = this.store.getState()
        this.state = { storeState }
      }
      // 周期方法及操作方法
      // ...
      getWrappedInstance() {
        return this.refs.wrappedInstance
      }
      render() {
        if (withRef) {
          this.renderedElement = createElement(WrappedComponent, {
            ...this.mergedProps,
            ref: 'wrappedInstance'
          })
        } else {
          this.renderedElement = createElement(WrappedComponent,
            this.mergedProps
          )
        }
        return this.renderedElement
      }
    }

    Connect.displayName = connectDisplayName
    Connect.WrappedComponent = WrappedComponent
    Connect.contextTypes = {
      store: storeShape
    }
    Connect.propTypes = {
      store: storeShape
    }
    return hoistStatics(Connect, WrappedComponent)
  }
}
```
* 使用了react-redux后，我们导出的对象不再是原先定义的xxxComponent，而是通过connect包裹后的新React.Component对象。connect执行后返回一个函数（wrapWithConnect），那么其内部势必形成了闭包。而wrapWithConnect执行后，必须要返回一个ReactComponent对象，才能保证原代码逻辑可以正常运行，而这个ReactComponent对象通过render原组件，形成对原组件的封装。
* connect通过context获取Provider中的store，通过store.getState()获取整个store tree 上所有state。
* connect模块的返回值wrapWithConnect为function。
* wrapWithConnect返回一个ReactComponent对象Connect，Connect重新render外部传入的原组件WrappedComponent，并把connect中传入的mapStateToProps, mapDispatchToProps与组件上原有的props合并后，通过属性的方式传给WrappedComponent。

下面结合代码进行分析一下每个函数的意义:
### mapStateToProps
`[mapStateToProps(state, [ownProps]): stateProps] (Function): `mapStateToProps是一个函数，参数state为store tree中所有state，参数props为通过组件Connect传入的props。
返回值表示需要merge进props中的state。
```javascript
computeStateProps(store, props) {
  if (!this.finalMapStateToProps) {
    return this.configureFinalMapState(store, props)
  
  const state = store.getState() //从store中获取state
  const stateProps = this.doStatePropsDependOnOwnProps ? //merge state
    this.finalMapStateToProps(state, props) :
    this.finalMapStateToProps(state
  if (process.env.NODE_ENV !== 'production') {
    checkStateShape(stateProps, 'mapStateToProps')
  }
  return stateProps
}
```

### mapDispatchToProps
`[mapDispatchToProps(dispatch, [ownProps]): dispatchProps] (Object or Function):`可以是一个函数，也可以是一个对象。
参数dispatch为store.dispatch()函数，参数props为通过组件Connect传入的props。
返回值表示需要merge进props中的action。
```javascript
computeDispatchProps(store, props) {
  if (!this.finalMapDispatchToProps) {
    return this.configureFinalMapDispatch(store, props)
  }

  const { dispatch } = store  
  const dispatchProps = this.doDispatchPropsDependOnOwnProps ? //merge action
    this.finalMapDispatchToProps(dispatch, props) :
    this.finalMapDispatchToProps(dispatch)

  if (process.env.NODE_ENV !== 'production') {
    checkStateShape(dispatchProps, 'mapDispatchToProps')
  }
  return dispatchProps
}
```
里面的dispatch就是store.dispatch

### mergeProps
`[mergeProps(stateProps, dispatchProps, ownProps): props] (Function):`是一个函数，定义了mapState,mapDispatch及this.props的合并规则，默认合并规则如下：
```javascript
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
})
```
该回调函数返回的对象将作为 props 传递到被包装的组件中。你也许可以用这个回调函数，根据组件的 props 来筛选部分的 state 数据，或者把 props 中的某个特定变量与 action creator 绑定在一起。如果你省略这个参数，默认情况下返回 Object.assign({}, ownProps, stateProps, dispatchProps) 的结果。mergeProps合并后的结果，会通过props传入Connect组件。

### options
`[options] (Object)` 是一个对象，包含pure和withRef两个属性
* pure 表示是否开启pure优化，如果为 true，connector 将执行 shouldComponentUpdate 并且浅对比 mergeProps 的结果，避免不必要的更新，前提是当前组件是一个“纯”组件，它不依赖于任何的输入或 state 而只依赖于 props 和 Redux store 的 state。默认值为 true。
* withRef用来给包装在里面的组件一个ref，可以通过getWrappedInstance方法来获取这个ref，默认为false。

## React如何响应store变化
React其实跟Redux没有直接联系，也就是说，Redux中dispatch触发store tree中state变化，并不会导致React重新渲染。react-redux才是真正触发React重新渲染的模块，那么这一过程是怎样实现的呢？
刚刚提到，connect模块返回一个wrapWithConnect函数，wrapWithConnect函数中又返回了一个Connect组件。Connect组件的功能有以下两点：
1. 包装原组件，将state和action通过props的方式传入到原组件内部
2. 监听store tree变化，使其包装的原组件可以响应state变化

> 何时注册
```javascript
componentDidMount() {
  this.trySubscribe()
}
//...
trySubscribe() {
  if (shouldSubscribe && !this.unsubscribe) {
    this.unsubscribe = this.store.subscribe(this.handleChange.bind(this))
    this.handleChange()
  }
}
```
可以看到，当Connect组件加载到页面后，当前组件开始监听store tree变化。

> 何时注销
```javascript
componentWillUnmount() {
  this.tryUnsubscribe()
  this.clearCache()
}
```
当当前Connect组件销毁后，我们希望其中注册的listener也一并销毁，避免性能问题。此时可以在Connect的componentWillUnmount周期函数中执行这一过程。

> 变更处理逻辑
```javascript
handleChange() {
  if (!this.unsubscribe) {
    return
  }

  const storeState = this.store.getState()
  const prevStoreState = this.state.storeState
  //Connect组件在初始化时，就已经在this.state中缓存了store tree中state的状态。
  //这两行分别取出当前state状态和变更前state状态进行比较
  if (pure && prevStoreState === storeState) {
    return
  }

  if (pure && !this.doStatePropsDependOnOwnProps) {
    const haveStatePropsChanged = tryCatch(this.updateStatePropsIfNeeded, this)
    if (!haveStatePropsChanged) {
      return
    }
    if (haveStatePropsChanged === errorObject) {
      this.statePropsPrecalculationError = errorObject.value
    }
    this.haveStatePropsBeenPrecalculated = true
  }

  this.hasStoreStateChanged = true
  this.setState({ storeState })
  //this.setState({ storeState }) storeState正是传给子组件的state，这里会触发Connect及其子组件的重新渲染。
}

```

## 总结
react-redux的核心功能都在connect模块中，多看看源码还是很有好处的，一方面可以加深自己对已使用框架的理解；再一方面可以学到一些优秀的编程思路。


