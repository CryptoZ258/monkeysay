var express = require('express');
var router = express.Router();
var AV = require('leanengine');

var Reply = AV.Object.extend('Reply');
var utils = require('../util/utils');
var laypage = require('laypage');

router.get('/of/mine/', function(req, res, next) {
  res.redirect('/reply/of/mine/page/1');
});

/**
 * 定义路由：获取关于我的回复
 */
router.get('/of/mine/page/:pageIndex', function(req, res, next) {

  utils.checkLogin(req, res, next);

  var status = 1;
  var pageSize = 10;
  var pageIndex = 1;
  var errMsg = null;
  var total = 0;
  if (req.query) {
    pageIndex = req.params.pageIndex || 1;
    status = req.query.status || 1;
    errMsg = req.query.errMsg;
  }
  var query1 = new AV.Query(Reply);
  query1.equalTo('status', parseInt(status));
  query1.equalTo('author', req.currentUser); // 必须是本人的

  var query2 = new AV.Query(Reply);
  query2.equalTo('status', parseInt(status));
  query2.equalTo('touser', req.currentUser);
  var query = AV.Query.or(query1, query2);
  query.include('author');
  query.include('touser');
  query.count().then(function(count){
    total = count;
  });

  query.descending('createdAt');
  query.skip(pageSize * (pageIndex-1));
  query.limit(pageSize);
  query.find({sessionToken: req.sessionToken}).then(function(results) {
    res.render('replies', {
      laypage: laypage({
        curr: pageIndex,
        url: '/reply/of/mine/page/' + pageIndex,
        pages: (total + pageSize - 1 ) / pageSize,
      }),
      title: '我的评论',
      user: req.currentUser,
      replies: results,
      utils: utils,
      status: status,
      errMsg: errMsg
    });
  }, function(err) {
    if (err.code === 101) {
      res.render('replies', {
        title: '我的评论',
        user: req.currentUser,
        replies: [],
        utils: utils,
        status: status,
        errMsg: '没有数据'
      });
    } else {
      throw err;
    }
  }).catch(next);
});

/**
 * 定义路由：创建新的 reply
 */
router.post('/to/:tid', function(req, res, next) {

  utils.checkLogin(req, res, next);

  var tid = req.params.tid;
  
  var re = new Reply();
  var touser = null;
  if (req.currentUser) {
    var acl = new AV.ACL(req.currentUser);
    acl.setPublicReadAccess(true);
    re.setACL(acl);
  }
  if(req.body.touid){
    touser = AV.Object.createWithoutData('_User', req.body.touid);
    re.set('touser', touser);
  }
  var content = req.body.content;
  re.set('author', req.currentUser);
  re.set('content', content);
  re.set('totid', tid);
  re.set('status', 1);
  re.save(null, {sessionToken: req.sessionToken}).then(function(reply) {
    var t = AV.Object.createWithoutData('Twitter', tid);
    t.increment('replynum', 1);
    t.save();

    res.redirect('/twitters/' + tid);
  }).catch(next);
});

router.get('/delete/:id', function(req, res, next) {
  var id = req.params.id;
  var t = AV.Object.createWithoutData('Reply', id);
  t.fetch().then(function(){
    if (t.get('author').id == req.currentUser.id){
      t.set('status', 0);
      t.save(null, {sessionToken: req.sessionToken}).then(function(tw) {
        res.redirect(req.headers.referer);
      }, function(err) {
        res.redirect(req.headers.referer + '?errMsg=' + JSON.stringify(err));
      }).catch(next);
    }
    else {
      res.redirect(req.headers.referer + '?errMsg=无权限');
    }
  });
  
  
});


module.exports = router;
