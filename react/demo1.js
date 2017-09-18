/**
动静分离

假设我们有一个下面这样的组件：

<ScrollTable
	width={300}
	color='blue'
	scrollTop={this.props.offsetTop}
/>
这是一个可以滚动的表格，offsetTop 代表着可视区距离浏览器的的上边界的距离，随着鼠标的滚动，这个值将会不断的发生变化，
导致组件的 props 不断地发生变化，组件也将会不断的重新渲染。如果使用下面的这种写法：

<OuterScroll>
	<InnerTable width={300} color='blue'/>
</OuterScroll>
因为 InnerTable 这个组件的 props 是固定的不会发生变化，在这个组件里面使用 pureRenderMixin 插件，
能够保证 shouldComponentUpdate 的返回一直为 false， 因此不管组件的父组件也就是 OuterScroll 组件的状态是怎么变化，
组件 InnerTable 都不会重新渲染。也就是子组件隔离了父组件的状态变化。

通过把变化的属性和不变的属性进行分离，减少了重新渲染，获得了性能的提升，同时这样做也能够让组件更容易进行分离，更好的被复用。

例子：轮播图

*/



/**

很多习惯于ES6的用户反而不理解在ES5下可以这么做：

//ES5
var PostInfo = React.createClass({
    handleOptionsButtonClick: function(e) {
        // Here, 'this' refers to the component instance.
        this.setState({showOptionsModal: true});
    },
    render: function(){
        return (
            <TouchableHighlight onPress={this.handleOptionsButtonClick}>
                <Text>{this.props.label}</Text>
            </TouchableHighlight>
        )
    },
});
在ES5下，React.createClass会把所有的方法都bind一遍，这样可以提交到任意的地方作为回调函数，而this不会变化。
但官方现在逐步认为这反而是不标准、不易理解的。

在ES6下，你需要通过bind来绑定this引用，或者使用箭头函数（它会绑定当前scope的this引用）来调用

//ES6
class PostInfo extends React.Component
{
    handleOptionsButtonClick(e){
        this.setState({showOptionsModal: true});
    }
    render(){
        return (
            <TouchableHighlight 
                onPress={this.handleOptionsButtonClick.bind(this)}
                onPress={e=>this.handleOptionsButtonClick(e)}
                >
                <Text>{this.props.label}</Text>
            </TouchableHighlight>
        )
    },
}
箭头函数实际上是在这里定义了一个临时的函数，箭头函数的箭头=>之前是一个空括号、单个的参数名、或用括号括起的多个参数名，
而箭头之后可以是一个表达式（作为函数的返回值），或者是用花括号括起的函数体（需要自行通过return来返回值，否则返回的是undefined）。

// 箭头函数的例子
()=>1
v=>v+1
(a,b)=>a+b
()=>{
    alert("foo");
}
e=>{
    if (e == 0){
        return 0;
    }
    return 1000/e;
}
需要注意的是，不论是bind还是箭头函数，每次被执行都返回的是一个新的函数引用，
因此如果你还需要函数的引用去做一些别的事情（譬如卸载监听器），那么你必须自己保存这个引用

// 错误的做法
class PauseMenu extends React.Component{
    componentWillMount(){
        AppStateIOS.addEventListener('change', this.onAppPaused.bind(this));
    }
    componentDidUnmount(){
        AppStateIOS.removeEventListener('change', this.onAppPaused.bind(this));
    }
    onAppPaused(event){
    }
}
// 正确的做法
class PauseMenu extends React.Component{
    constructor(props){
        super(props);
        this._onAppPaused = this.onAppPaused.bind(this);
    }
    componentWillMount(){
        AppStateIOS.addEventListener('change', this._onAppPaused);
    }
    componentDidUnmount(){
        AppStateIOS.removeEventListener('change', this._onAppPaused);
    }
    onAppPaused(event){
    }
}
一种新的做法：

// 正确的做法
class PauseMenu extends React.Component{
    componentWillMount(){
        AppStateIOS.addEventListener('change', this.onAppPaused);
    }
    componentDidUnmount(){
        AppStateIOS.removeEventListener('change', this.onAppPaused);
    }
    onAppPaused = (event) => {
        //把方法直接作为一个arrow function的属性来定义，初始化的时候就绑定好了this指针
    }
}

*/

/**

在render方法里jsx结构中，，把方法作为回调，例如ref,或者点击事件等，不要直接写箭头函数或者直接进行bind操作绑定this，
如果这样做，在每次render的时候都会重新创建该方法，会造成子组件内的PureComponent优化失效，例如：

<Swiper  renderPage={(a,b,c)=>this.renderPage(a,b,c)}
                            autoPlay={false}  />
                            <div click ={()=>{this.setState({a:1})}}></div>
如果Swiper里做了shouldComponentUpdate的优化，而这里click时会触发reRender，每次都会重新创建  renderPage方法
，这样   Swiper里做了shouldComponentUpdate的优化就失效了

正确的做法参照上面，一种绑定在constructor里面，一种函数定义的时候就定义成箭头函数                     
                           
                           
                           
                      
*/
