import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import styles from './index.module.scss';


import {
  enableRefresh, 
  onRefresh, 
} from 'nativeUtils';   // native实现，也可以前端自己实现


/**
 * ScrollView
 * 支持客户端原生下拉刷新
 * 支持滚动曝光埋点
 * 
 * 如果需要滚动曝光，则要使用renderItem 方法定义子元素，否则可以简单一点直接在ScrollView标签下定义子元素
 */

class ScrollView extends PureComponent {
    static propTypes = {
      onRefresh:PropTypes.func,   // 下拉刷新的回调
      data:PropTypes.array, // 列表的数据
      /**
       * renderItem: (info: {
       *     item: ItemT,
       *     index: number,
       * }) => ?React.Element<any>,
       */
      renderItem:PropTypes.func,  // 渲染列表的方法
      /**
       * 额外的key  (item: Item, index: number) => string, 不传默认 index
       */
      keyExtractor:PropTypes.func, 
      /**
       * Called when the viewability of rows changes
       * onViewableItemsChanged:({viewableItems: Array,viewableIndices: Array})
       */
      onViewableItemsChanged:PropTypes.func,

      /**
       * 到达底部触发的回调函数,
       * 如果上拉加载需要自己设置一个加载状态，比如loadState
       * loadState初始值为false,加载的时候设为true，在这个回调中，只有loadState为false才触发加载
       */
      onEndReached:PropTypes.func,

      /**
       * 到达底部的临界值，默认为0
       */
      onEndReachedThreshold:PropTypes.number,

      /**
       * 是否展示加载更多：默认为 true
       */
      showLoadMore:PropTypes.bool,

      /**
       * 自定义渲染加载更多文案
       */
      renderLoadMore:PropTypes.func,

      // 是否允许下拉刷新，默认 false
      isEnableRefresh:PropTypes.bool,

      // scrollView 没有全屏，可能父容器设置了margin or padding
      additionalOffset: PropTypes.number,

    }

    constructor(props) {
      super(props);
      this.enableRefresh = true; // 默认进来允许下拉刷新
      this.cellRefs = [];   // cell ref 集合
      this.viewableIdxArray = []; // 可见item index 集合
      this.state = {
        height: document.documentElement.clientHeight,
      };
        
    }

    static defaultProps = {
      keyExtractor: (item, index) => {
        if (item.key != null) {
          return item.key;
        }
        return String(index);
      },
      onEndReachedThreshold:0,
      showLoadMore: true,
      isEnableRefresh: false,
      additionalOffset:0,
    };
    componentWillMount() { }

    componentDidMount() {

      const hei = this.state.height - ReactDOM.findDOMNode(this.container).offsetTop - this.props.additionalOffset;
      setTimeout(() => this.setState({
        height: hei,
      }), 0);
      // 默认进来不允许下拉刷新
      this.props.isEnableRefresh && enableRefresh(this.enableRefresh);
      onRefresh(this.props.onRefresh);

      // this._updateViewableItems();
    
    }
    componentDidUpdate(prevProps) {
      // console.log(prevProps.data,this.props.data)
      if (prevProps.data !== this.props.data) {
        this._updateViewableItems();
      }
    }

    getRect(node) {
      const height = node.offsetHeight;
      const width = node.offsetWidth;
      let left = node.offsetLeft;
      let top = node.offsetTop;
      return { height, left, top, width };
    }
    measureLayout(node) {
      const relativeNode = document.body;
      const relativeRect = this.getRect(relativeNode);
      const { height, left, top, width } = this.getRect(node);
      const x = left - relativeRect.left;
      const y = top - relativeRect.top;
      return { x, y, width, height };
    }
    
    onScroll = (e) => {
      let node = ReactDOM.findDOMNode(this.loadMore);
      let container = ReactDOM.findDOMNode(this.container);
      let scrollTop = container.scrollTop;
      let viewableHeight = container.clientHeight;
      if (this.measureLayout(node).y <= scrollTop + viewableHeight + this.props.onEndReachedThreshold) {
        this.props.onEndReached && this.props.onEndReached();
      }
      this.props.onScroll && this.props.onScroll(e);
      let y = e.nativeEvent.target.scrollTop;
      if (y === 0) {
        this.enableRefresh = true;
        enableRefresh(this.enableRefresh);
      } else if (this.enableRefresh) {
        this.enableRefresh = false;
        enableRefresh(this.enableRefresh);
      }
      this._updateViewableItems();
    }

    _updateViewableItems = () => {
      let container = ReactDOM.findDOMNode(this.container);
      let y = container.scrollTop;  // 滚动条位置
      let viewableHeight = container.clientHeight; // 可视区域高度
      
      let nextViewableIdxArray = this.cellRefs.map((item, idx) => {
        let layout = this.measureLayout(item);
        // 可视y轴范围    [y , y+viewableHeight]
        if ((layout.y + layout.height) >= y && layout.y <= (y + viewableHeight)) {
          return idx;
        }
      }).filter((item) => item !== undefined);
      if (nextViewableIdxArray.toString() !== this.viewableIdxArray.toString()) {
        this.viewableIdxArray = nextViewableIdxArray;
        this._onViewableItemsChanged();
        
      }
    }

    _onViewableItemsChanged() {
      // console.log(this.viewableIdxArray)
      let viewableItems = this.viewableIdxArray.map((item) => {
        return this.props.data[item];
      });

      this.props.onViewableItemsChanged && this.props.onViewableItemsChanged({
        viewableItems:viewableItems,
        viewableIndices:this.viewableIdxArray,
      });
    }

    _getItem = (data, index) => {
      // const {numColumns} = this.props;
      return data[index];
    };
    render() {
      let loadMore = this.props.showLoadMore ? <div  ref={(c) => {this.loadMore = c;}}>
        {this.props.renderLoadMore ? this.props.renderLoadMore() : <div className={styles.loadMore}></div>}</div> : null;
      if (this.props.children) {
        return (
          <div
            onScroll={this.onScroll}
            ref={el => this.container = el}
            style={{
              height: this.state.height,
              overflow: 'auto',
            }}
          >
            {this.props.children}
            {loadMore}
          </div>
        );
      }
      const {data, keyExtractor, renderItem} = this.props;
      let cells = [];
      this.cellRefs = [];
      
      for (let i = 0; i < data.length; i++) {
        const item = this._getItem(data, i);
        const key = keyExtractor(item, i);
        const element = renderItem({
          item,
          index:i,
        });
        // const ref = `cell-${key}`;
        // this.cellRefs.push(ref);
        cells.push(
          <div
            key={key}
            ref={el => el && this.cellRefs.push(el)}
          
          >
            {element}
          </div>);
      }

      
      return (
        <div
          onScroll={this.onScroll}
          ref={el => this.container = el}
          style={{
            height: this.state.height,
            overflow: 'auto',
          }}
        >
          {cells}
          {loadMore}

        </div>
      );
    }
}

export default ScrollView;