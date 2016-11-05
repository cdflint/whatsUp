var express = require('express');
var router = express.Router();

var home = require('./home');
var admin = require('./admin');
var event = require('./event');
var auth = require('./auth');
var users = require('./users');
var events = require('./events');
var profile = require('./profile');
var map = require('./map');
var list = require('./list');
var calendar = require('./calendar');
// var create = require('./create');

//authorized middleware
var authorized = require('../appDomain').authorization;

//this middleware is to detect user and pass an instance 
//of current logged in user to locals to make available in view
router.use(function(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("router middleware: there's a logged in user");
    res.locals.user = req.user;
  }
  next();
});

/*Site routes*/
router.use('/', home);
router.use('/index', home);
router.use('/admin', admin);
router.use('/event', event);
router.use('/auth', auth);
router.use('/profile', profile);
router.use('/map', map);
router.use('/list', list);
router.use('/calendar', calendar );
//Api routes
router.use('/events', events);
router.use('/users', users);

//authorized error handler
router.use(function(err, req, res, next) {
  if (err instanceof authorized.UnauthorizedError) {
    res.status(401)
      .send([
        '<h3>',
        'Unauthorized Access. Your account does not have enough privilege to access this area!',
        '</h3>'
      ].join(''));
  } else {
    next(err);
  }
});

module.exports = router;
