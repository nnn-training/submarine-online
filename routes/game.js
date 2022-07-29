const express = require('express');
const router = express.Router();
const config = require('../config');

router.get('/', (req, res, next) => {
  let displayName = 'anonymous';
  let thumbUrl = 'anonymous';
  if (req.user) {
     displayName = req.user.displayName;
     thumbUrl = req.user.photos[0].value;
  }
  res.render('game', { title: '潜水艦ゲーム', displayName: displayName, thumbUrl: thumbUrl, ipAddress: config.ipAddress });
});

module.exports = router;