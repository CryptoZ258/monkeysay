/*
* 工具类
* add by bibodeng, 2016-09-24
*/
'use strict';

module.exports = {
  isTrue: function(cond, errMsg)
  {
    if(cond){
      return true;
    }
    else
    {
      var msg = errMsg || 'Assertion failed';
      if (typeof Error !== "undefined") {
        throw new Error(msg);
      }
      throw {message: msg, name: '', stack: null};
    }
  }
};
