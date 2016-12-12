var express = require('express');
var router = express.Router();
var AV = require('leanengine');
var utils = require('../util/utils');

router.get('/download', function(req, res, next) {
  utils.checkLogin(req, res, next);
  
  res.render('client', {
    errMsg: req.query.errMsg ? req.query.errMsg : '',
    user: req.currentUser,
  });
});

module.exports = router;
