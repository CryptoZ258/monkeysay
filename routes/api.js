/**
 * WebAPI列表
 * 1. Twitter：获取推文列表，获取单条推文，发布推文
 * 2. Reply：获取推文评论，获取我的评论，发布评论
 * 3. User：获取个人信息，设置个人信息
 */
var express = require('express');
var router = express.Router();
var AV = require('leanengine');
var utils = require('../util/utils');

var Twitter = AV.Object.extend('Twitter');
var Reply = AV.Object.extend('Reply');

/**
 * 定义路由：获取所有 Twitter 列表，并进行分页
 */
router.get('/twitters/page/:pageIndex', function(req, res, next) {

  utils.verifyClient(req, res, next);

  var pageIndex = 1;
  var author = null;
  var authorName = '';
  var pageSize = 20;
  var query = new AV.Query('Twitter');

  if (req.query) {
    pageIndex = req.params.pageIndex || 1;
    var userid = req.query.userid;
    if(userid){
      author = AV.Object.createWithoutData('_User',userid);
      author.fetch().then(function () {
        authorName = author.get('username');
      });
      query.equalTo('author', author);
    }
  }
  query.equalTo('status', 1);
  query.descending('date');
  query.skip(pageSize * (pageIndex-1));
  query.limit(pageSize);
  query.include('author');
  query.find().then(function(results) {
    res.send(utils.makeJson(200, 'OK', results));
  }, function (err) {
    res.send(utils.makeJson(400, 'NO_DATA', {}));
  }).catch(function(ex){
    res.send(utils.makeJson(500, 'ERROR', '获取出错'));
  });

});

/*
* 定义路由：查看单条碎语及其评论
*/
router.get('/twitters/:tid', function(req, res, next) {

  utils.verifyClient(req, res, next);

  var tid = req.params.tid;

  if (tid){
    var query = new AV.Query('Twitter');
    query.include('author');
    query.get(tid).then(function(t){
      if (t){
        // get replies
        var query = new AV.Query('Reply');
        query.include('author');
        query.equalTo('totid', t.id);
        query.equalTo('status', 1);
        query.descending('createdAt');
        query.limit(200); // 最大两百条
        query.find().then(function(result){
          res.send(utils.makeJson(200, 'OK', {twitter: t, replies: result}));
        });
      }else{
        res.send(utils.makeJson(404, 'NOT_FOUND', '该条碎语不存在'));
      }
    });
  }
});

/**
 * 定义路由：发表新的 twitter
 */
router.post('/twitters', function(req, res, next) {

  utils.verifyClient(req, res, next);

  var acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);
  
  var t = new Twitter();
  var picArr = [];
  if (req.body.pics){
    req.body.pics.forEach(function(element) {
      var file = AV.Object.createWithoutData('_File', element);
      picArr.push(file);
    }, this);
  }
  if (req.body.uid){
    var author = AV.Object.createWithoutData('_User', req.body.uid);
    t.set('author', author);
  }
  else{
    res.send(utils.makeJson(400, 'ERROR', '未填写uid'));
  }
  if (req.body.content){
    t.set('content',req.body.content);
  }
  else{
    res.send(utils.makeJson(400, 'ERROR', '未填写content'));
  }
  
  t.set('content',req.body.content);
  t.set('replynum', 0);
  t.set('status', 1);
  t.set('pics', picArr); // File Array
  t.set('date', new Date());
  t.setACL(acl);
  t.save().then(function(tw){
    res.send(utils.makeJson(200, 'OK', '发布成功'));
  }, function (error) {
    res.send(utils.makeJson(500, 'ERROR', '发布碎语出错'));
  }).catch(function(ex){
    res.send(utils.makeJson(500, 'ERROR', '发布碎语出错'));
  });

  res.send(utils.makeJson(200, 'OK', ''));
});

/**
 * 定义路由：获取关于我的回复
 */
router.get('/reply/of/mine/page/:pageIndex', function(req, res, next) {
  
  utils.verifyClient(req, res, next);

  var pageSize = 10;
  var pageIndex = 1;
  if (req.query) {
    pageIndex = req.params.pageIndex || 1;
  }
  var query1 = new AV.Query(Reply);
  query1.equalTo('status', 1);

  var query2 = new AV.Query(Reply);
  query2.equalTo('status', 1);

  if (req.query.uid){
    var user = AV.Object.createWithoutData('_User', req.query.uid);
    query1.equalTo('author', user); // 必须是本人的
    query2.equalTo('touser', user); // 及发送给本人的
  }
  else{
    res.send(utils.makeJson(400, 'ERROR', '未填写uid'));
  }
  
  var query = AV.Query.or(query1, query2);
  query.include('author');
  query.include('touser');
  query.descending('createdAt');
  query.skip(pageSize * (pageIndex-1));
  query.limit(pageSize);
  query.find({sessionToken: req.sessionToken}).then(function(results) {
    res.send(utils.makeJson(200, 'OK', results));
  }, function(err) {
    res.send(utils.makeJson(500, 'ERROR', '获取评论出错'));
  }).catch(function(ex){
    res.send(utils.makeJson(500, 'ERROR', '获取评论出错'));
  });
});

/**
 * 定义路由：创建新的 reply
 */
router.post('/reply/to/:tid', function(req, res, next) {

  utils.verifyClient(req, res, next);

  var tid = req.params.tid;
  var touser = null;
  var re = new Reply();
  var author = null;
  if(req.body.uid){
    var author = AV.Object.createWithoutData('_User', req.body.uid);
    var acl = new AV.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    re.setACL(acl);
  }
  else{
    res.send(400, 'ERROR', '未填写uid');
  }
  if(req.body.touid){
    touser = AV.Object.createWithoutData('_User', req.body.touid);
    re.set('touser', touser);
  }
  else{
    res.send(400, 'ERROR', '未填写touid');
  }
  var content = req.body.content;
  re.set('author', author);
  re.set('content', content);
  re.set('totid', tid);
  re.set('status', 1);
  re.save().then(function(reply) {
    var t = AV.Object.createWithoutData('Twitter', tid);
    t.increment('replynum', 1);
    t.save();
    res.send(utils.makeJson(200, 'OK', '发布成功'));
  }).catch(function(ex){
    res.send(utils.makeJson(500, 'ERROR', '发送出错'));
  });
});

/* 暂不开放更新和删除，需要解决鉴权问题
router.get('/twitters/delete/:id', function(req, res, next) {
  utils.verifyClient(req, res, next);

  var id = req.params.id;
  var t = AV.Object.createWithoutData('Twitter', id);
  t.set('status', 0);
  t.save().then(function(tw) {
    res.send(utils.makeJson(200, 'OK', '删除成功'));
  }, function(err) {
    res.send(utils.makeJson(500, 'ERROR', '删除出错'));
  }).catch(next);
});

router.get('/reply/delete/:id', function(req, res, next) {
  utils.verifyClient(req, res, next);

  var id = req.params.id;
  var t = AV.Object.createWithoutData('Reply', id);
  t.set('status', 0);
  t.save().then(function(r) {
    res.send(utils.makeJson(200, 'OK', '删除成功'));
  }, function(err) {
    res.send(utils.makeJson(500, 'ERROR', '删除出错'));
  }).catch(next);
});
*/

router.post('/login', function(req, res, next) {
  
  var username = req.body.username;
  var password = req.body.password;

  AV.User.logIn(username, password).then(function(user) {
    //res.saveCurrentUser(user);
    res.send(req.currentUser);
  }, function(err) {
    res.send(err);
  }).catch(next);
});


router.post('/register', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  if (!username || username.trim().length == 0
    || !password || password.trim().length == 0) {
    return res.redirect('/users/register?errMsg=用户名或密码不能为空');
  }
  var user = new AV.User();
  user.set("username", username);
  user.set("password", password);
  user.signUp().then(function(user) {
    res.saveCurrentUser(user);
    res.redirect('/twitters');
  }, function(err) {
    res.redirect('/users/register?errMsg=' + JSON.stringify(err));
  }).catch(next);
});

router.get('/logout', function(req, res, next) {
  req.currentUser.logOut();
  res.clearCurrentUser();
  return res.redirect('/users/login');
})

// TODO: 发布评论等
module.exports = router;
