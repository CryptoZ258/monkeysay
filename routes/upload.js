var express = require('express');
var router = express.Router();
var AV = require('leanengine');
var utils = require('../util/utils');

var Picture = AV.Object.extend('Picture');
var multiparty = require('multiparty');
var fs = require('fs'); // filesystem
var laypage = require('laypage');



/**
 * 默认路由: upload/
 */
router.get('/pictures', function(req, res, next){
  try{
    utils.checkLogin(req, res, next);

    var errMsg = null;
    var author = null;
    var authorName = '';
    var pageIndex = 1;
    var pageSize = 20;
    var total = 0;
    var query = new AV.Query('Picture');

    if (req.query) {
      pageIndex = req.params.pageIndex || 1;
      errMsg = req.query.errMsg;
    }
    query.equalTo('status', 1);

    // 统计总数量
    query.count().then(function(count){
      total = count;
    });

    query.descending('createdAt');
    query.skip(pageSize * (pageIndex-1));
    query.limit(pageSize);
    query.include('author');
    query.find({sessionToken: req.sessionToken}).then(function(results) {
      res.render('upload', {
        laypage: laypage({
          curr: pageIndex,
          url: '/upload/page/' + pageIndex,
          pages: (total + pageSize - 1 ) / pageSize,
        }),
        title: authorName + '图片库',
        user: req.currentUser,
        pics: results,
        errMsg: errMsg,
        utils: utils,
      });
    }, function (err) {
      if (err.code === 101) {
        res.render('upload', {
          title: '图片库',
          user: req.currentUser,
          pics: [],
          errMsg: '没有数据',
        });
      } else {
        throw err;
      }
    }).catch(next);
  }
  catch(err){
    res.render('upload', {
      title: '图片库',
      user: req.currentUser,
      pics: [],
      errMsg: err,
    });
  }
});


/*
* 上传图片
*/
router.post('/picture', function(req, res, next) {

  utils.checkLogin(req, res, next);

  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files){
    var tpicFile = files.pic[0];
    if(tpicFile && tpicFile.size !== 0){
      fs.readFile(tpicFile.path, function(err, data){
        if(err) {
          res.send(utils.makeJson(500, null, '读取文件失败！'));
        }
        var theFile = new AV.File(tpicFile.originalFilename, data);
        theFile.save({sessionToken: req.sessionToken}).then(function(theFile){

        var acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);

        var t = new Picture();
        t.set('author', req.currentUser);
        t.set('content', theFile);
        t.set('tags', '');
        t.set('status', 1);
        t.setACL(acl);
        t.save(null, {sessionToken: req.sessionToken}).then(function(tw){
          res.redirect('/upload/pictures');
        }, function (error) {
          res.send('上传图片出错' + error);
        }).catch(next);

          // res.send({status:200, data: {fileid: theFile.id, url: theFile.url}, msg:'上传成功！'});
        }).catch(console.error);
      });
    }else {
      res.send(utils.makeJson(500, null, '请选择一个文件。'));
    }

  });
});

router.get('/delete/:id', function(req, res, next){
  var id = req.params.id;
  var t = AV.Object.createWithoutData('Picture', id);
  t.fetch().then(function(){
    if (t.get('author').id == req.currentUser.id){
      t.set('status', 0);
      t.save(null, {sessionToken: req.sessionToken}).then(function(pic) {
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
