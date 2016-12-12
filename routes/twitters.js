var express = require('express');
var router = express.Router();
var AV = require('leanengine');
var utils = require('../util/utils');

var Twitter = AV.Object.extend('Twitter');
//var multipart = require('multipart');
var fs = require('fs'); // filesystem
var laypage = require('laypage');


/*router.get('/repaire_acl', function(req, res, next){
  utils.checkLogin(req, res, next);

  var acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);

  var query = new AV.Query('Twitter');
  query.notEqualTo('ACL', acl);
  query.equalTo('status', 1);
  query.descending('date');
  query.limit(500);
  query.find({sessionToken: req.sessionToken}).then(function(results) {
    res.send(results);
    for(var i=0; i< results.length; i++){
      results[i].setACL(acl);
      results[i].save();
    }
    res.send('success');
  }, function (err) {
    res.send(err);
  }).catch(next);
});*/

/**
 * 默认路由
 */
router.get('/', function(req, res, next){
  var redirectUrl = '/twitters/page/1?';
  if(req.query.userid){
    redirectUrl += ('userid='+req.query.userid + '&');
  }
  if(req.query.errMsg){
    redirectUrl += '&errMsg='+req.query.errMsg;
  }
  if(req.query.keyword){
    redirectUrl += '&keyword='+req.query.keyword;
  }
  res.redirect(redirectUrl);
  
});

/**
 * 获取所有 Twitter 列表，并进行分页
 */
router.get('/page/:pageIndex', function(req, res, next) {

  try{
    utils.checkLogin(req, res, next);

    var errMsg = null;
    var author = null;
    var authorName = '';
    var pageIndex = 1;
    var pageSize = 20;
    var total = 0;
    var query = new AV.Query('Twitter');

    utils.assert(req.params , '查询条件有误');
    utils.assert(req.params.pageIndex, '未指定页码');

    if (req.query) {
      pageIndex = req.params.pageIndex || 1;
      errMsg = req.query.errMsg;
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
    if(req.query.keyword){
      query.contains('content', req.query.keyword);
    }
    // 统计总数量
    query.count().then(function(count){
      total = count;
    });

    query.descending('date');
    query.skip(pageSize * (pageIndex-1));
    query.limit(pageSize);
    query.include('author');
    query.find({sessionToken: req.sessionToken}).then(function(results) {
      res.render('twitters', {
        laypage: laypage({
          curr: pageIndex,
          url: '/twitters/page/' + pageIndex,
          pages: (total + pageSize - 1 ) / pageSize,
        }),
        title: authorName + '碎语',
        user: req.currentUser,
        twitters: results,
        errMsg: errMsg,
        baseUrl: req.protocol + '://' + req.get('host'),
        utils: utils,
      });
    }, function (err) {
      if (err.code === 101) {
        res.render('twitters', {
          title: '碎语',
          user: req.currentUser,
          twitters: [],
          errMsg: '没有数据',
        });
      } else {
        throw err;
      }
    }).catch(next);
  }
  catch(err){
    res.render('twitters', {
      title: '碎语',
      user: req.currentUser,
      twitters: [],
      errMsg: err,
    });
  }
});

/**
 * markdown 预览
 */
router.post('/preview', function(req, res, next){
  utils.checkLogin(req, res, next);

  if(req.body.content){
    res.send(utils.markdown.toHTML(req.body.content));
  } else {
    res.send('');
  }
});

/*
* 查看单条碎语及其评论
*/
router.get('/:tid', function(req, res, next) {

  utils.checkLogin(req, res, next);

  var tid = req.params.tid;
  var errMsg = '';
  if (req.query) {
    errMsg = req.query.errMsg;
  }

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
        query.find({sessionToken: req.sessionToken}).then(function(result){
          res.render('twitter', {
            title: '碎语详情',
            user: req.currentUser,
            twitter: t,
            replies: result,
            errMsg: errMsg,
            utils: utils,
          });
        });
      }else{
        res.status(404).send('该条碎语不存在');
      }
    });
  }
  else {
    res.status(400).send('无效的tid');
  }
});


/*
* 上传图片
*/
router.post('/uploadfile', function(req, res, next) {

  utils.checkLogin(req, res, next);

  var tpicFile = req.files.tpic;
  if(tpicFile){
    fs.readFile(tpicFile.path, function(err, data){
      if(err) {
        //return res.send('读取文件失败');
        res.json({status: 500, data:null, msg:'读取文件失败！'});
      }
      var theFile = new AV.File(tpicFile.originalFilename, data);
      theFile.save({sessionToken: req.sessionToken}).then(function(theFile){
        //res.send('上传成功！');
        res.json({status:200, data: {fileid: theFile.id}, msg:'上传成功！'});
      }).catch(console.error);
    });
  } else {
    //res.send('请选择一个文件。');
    res.json({status:404, data:null, msg: '请选择一个文件。'});
  }

});

/**
 * 发表新的 twitter
 */
router.post('/', function(req, res, next) {

  try{
    utils.checkLogin(req, res, next);
    utils.assert(req.body && req.body.content, '内容不能为空');
    var errMsg = '';
    if (req.currentUser) {
      var acl = new AV.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(true);
    }
    else{
      res.redirect('/users/login');
    }
    
    var picArr = [];
    if (req.body.pics){
      req.body.pics.forEach(function(element) {
        var file = AV.Object.createWithoutData('_File', element);
        picArr.push(file);
      }, this);
    }
    var t = new Twitter();
    t.set('content',req.body.content);
    t.set('author', req.currentUser);
    t.set('replynum', 0);
    t.set('status', 1);
    t.set('pics', picArr); // File Array
    t.set('date', new Date());
    t.setACL(acl);
    t.save(null, {sessionToken: req.sessionToken}).then(function(tw){
      res.redirect('/twitters');
    }, function (error) {
      res.send('发布碎语出错' + error);
    }).catch(next);
  }
  catch(ex){
    res.send(ex.message);
  }
});

/**
 * 删除指定 twitter
 */

router.get('/delete/:id', function(req, res, next) {
  var id = req.params.id;
  var t = AV.Object.createWithoutData('Twitter', id);
  t.fetch().then(function(){
    if(t.get('author').id == req.currentUser.id)
    {
      t.set('status', 0);
      t.save(null, {sessionToken: req.sessionToken}).then(function(tw) {
        res.redirect('/twitters');
      }, function(err) {
        res.redirect('/twitters?errMsg=' + JSON.stringify(err));
      }).catch(next);
    }
    else {
      res.redirect('/twitters?errorMsg=无权限');
    }
  });
  
});


router.post('/search', function(req, res, next){
  if (req.body.keyword)
  {
    var keyword = req.body.keyword;
    res.redirect('/twitters/page/1?keyword=' + keyword);
  }
  else
  {
    res.redirect('/twitters/page/1?errorMsg=无结果');
  }

});
module.exports = router;
