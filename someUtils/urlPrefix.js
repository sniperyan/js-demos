/**
 * request URL 前缀
 * 如果新增环境则设置新的NODE_ENV
 * 
 * 用于设置代理
 * 比如webpack或者nginx可以匹配拦截/proxy 的请求
 */

let URL_PREFIX = '';
switch (process.env.NODE_ENV) {
  case 'development':
    URL_PREFIX = '/proxy';
    break;
  case 'production':
    URL_PREFIX = '/proxy';
    break;
  case 'testing':
    URL_PREFIX = '/proxy';
    break;
}
export default URL_PREFIX;
