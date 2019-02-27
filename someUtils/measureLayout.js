/**
         *
         * like react native View api onLayout 
         * ViewLayout = {
            x: number,
            y: number,
            width: number,
            height: number
        };
         *
         * */ 

function getRect(node) {
    const height = node.offsetHeight;
    const width = node.offsetWidth;
    let left = node.offsetLeft;
    let top = node.offsetTop;
    return { height, left, top, width };
}
/**
 * 
 * @param {*} node 计算layout的 dom 节点
 * @param {*} [relativeNode] 默认相对于body
 */
export default function measureLayout(node, relativeNode=document.body){
    const relativeRect = getRect(relativeNode);
    const { height, left, top, width } = getRect(node);
    const x = left - relativeRect.left;
    const y = top - relativeRect.top;
    return { x, y, width, height };
};