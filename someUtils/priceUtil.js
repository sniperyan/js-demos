
/**
 * 价格计算工具方法类库
 * 加法和减法操作接收参数均以元为单位，返回的价格以元为单位
 */

//价格加法，接收元为单位的价格，返回元为单位的价格
export const accAdd = (...args) => {
    let temp100 = 0;
    args.forEach(item => {
      temp100 += Math.round(Number(item) * 100);
    });
    return (temp100 / 100).toFixed(2);
  };
  
  //价格减法，接收元为单位的价格，返回元为单位的价格
  export const accMul = (arg1, arg2) => {
    let temp100 =  Math.round(Number(arg1) * 100) - Math.round(Number(arg2) * 100);
    return (temp100 / 100).toFixed(2);
  };
  
  // 分转元
  export const centToYuan = (cent) => {
    return (Number(cent) / 100).toFixed(2);
  };
  
  //元转分
  export const yuanToCent = (yuan) => {
    return Math.round(Number(yuan) * 100);
  };
      
  