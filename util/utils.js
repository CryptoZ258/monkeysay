/*
* 工具类
* add by bibodeng, 2016-09-24
*/

var sprintf = require('sprintf').sprintf;
var server_api = require('./server_api');
var request = require('sync-request');
var sha1 = require('sha1');
var markdown = require('markdown').markdown;
var assert = require('./assert');

var utils = {
  assert: assert.isTrue,
  markdown: markdown, // import markdown
  timefriendly: function(date)
  {
    var ret = '';
    var now = new Date();
    var d = new Date(date);
    var sec = Math.floor((now - d)/1000);
    var hour = Math.floor(sec/3600);
    if (hour == 0){
      var min = Math.floor(sec / 60);
      if (min == 0) {
        ret = sprintf('%d 秒前', sec);
      } else {
        ret = sprintf("%d 分钟前", min);
      }
    }
    else if (hour < 24){
      ret = sprintf('约 %d 小时前', hour);
    }
    else
    {
      ret = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " +  d.getHours() +
         ":" + d.getMinutes() + ":" + d.getSeconds();
    }
    return ret;
  },
  // mobile appId and appKey
  appId: 'de5f80cfaa72746d587a6f3235107592',
  appKey: '14241a8d95456f2fa9d2cbff25370ae6',

  makeSign: function(appId, appKey, nonce)
  {
    var str = appId+appKey+nonce;
    var rlt = sha1(str);
    return rlt;
  },

  makeNonce: function()
  {
     var rlt = Math.random().toString(36).substr(2);
     return rlt;
  },
  // 验证登录
  checkLogin: function(req, res, next)
  {
    try{
      if (!req.currentUser) {
        res.redirect('/users/login');
      }
    }
    catch(ex){
      next(ex);
    }
    
  },
  verifyClient: function(req, res, next){
    var pass = false;
    if(req.headers){
      var appkey = this.appKey;
      var str = req.headers.appid + appkey + req.headers.nonce; // all lowercase
      var computeHashValue = sha1(str);
      if (computeHashValue == req.headers.sign){
          pass = true;
      }
    }
    if (!pass){
      res.send(utils.makeJson(403, 'VERIFY_FAIL', '未通过验证的客户端'));
    }
    return pass;
  },

  makeJson: function(status, msg, data)
  {
    var obj = {
      status: status,
      msg: msg,
      data: data
    };
    return JSON.stringify(obj);
  }
};

module.exports = utils;
