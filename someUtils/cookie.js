export const setCookie = (key, value) => {
    const exp = new Date();
    exp.setTime(exp.getTime() + (1000 * 60 * 60 * 24));
    document.cookie = `${key}=${value};expires=${exp.toGMTString()};path=/`;
  };
    
  export const setCookieDomain = (key, value, domain) => {
    const exp = new Date();
    exp.setTime(exp.getTime() + (1000 * 60 * 60 * 24));
    document.cookie = `${key}=${value};expires=${exp.toGMTString()};path=/; domain=${domain}`;
  };
    
  export const getCookie = (key) => {
    const ca = document.cookie.split(';');
    let value = '';
    ca.forEach((item) => {
      const c = item;
      if (c.indexOf(`${key}=`) >= 0) {
        value = c.replace(`${key}=`, '');
      }
    });
    return value.trim();
  };
    
  export const setLocalStorage = (name, val) => {
    localStorage.setItem(name, JSON.stringify(val));
  };
    
  export const getLocalStorage = name => JSON.parse(localStorage.getItem(name));
  
  /**
   * 删除cookie
   * 注意---服务端不能设置 http only  cookie，否则无法删除
   * @param {*} sKey 
   * @param {*} sPath 
   * @param {*} sDomain 
   */
  export const deleteCookie = (sKey, sPath, sDomain) => {
    document.cookie = encodeURIComponent(sKey) + 
                    '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + 
                    (sDomain ? '; domain=' + sDomain : '') + 
                    (sPath ? '; path=' + sPath : '');
  };
  
    