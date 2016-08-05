var express = require('express'),
    router = express.Router();

// Define chat route
router.get('/', function(request, response) {
  response.render('chat');
});

module.exports = router;
