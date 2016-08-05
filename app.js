var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    mongoose = require('mongoose'),
    Chat = require('./models/Chat'),
    router = require('./routes/server-routes'),
    users = {};

mongoose.connect((process.env.MONGODB_URI || 'mongodb://localhost/develop-denver'));

// Static assets
app.use(express.static('./public'));

// Set views
app.set('view engine', 'jade');
app.set('views', './views');

// All socket code goes inside here below
io.sockets.on('connection', function(socket) {
  // Query mongo and put in conditions for search {} is everything
  var query = Chat.find({});
  // Make variable above so you can put limit of last amount of messages on db
  // The -created takes the most recent however many number of messages i put in to load
  query.sort('-created').limit(9).exec(function(err, docs) {
    if (err) { throw err; }
    socket.emit('load old messages', docs);
  });

  // New user sign on
  socket.on('new user', function(data, callback) {
    if ( data in users ) {
      callback(false);
    } else {
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNicknames();
    }
  });

  // Function to update nicknames duh
  function updateNicknames() {
    io.sockets.emit('usernames', Object.keys(users));
  }

  // Function to send message
  socket.on('send message', function(data, callback) {
    var msg = data.trim();
    // Save message to mongo db
    var newMsg = new Chat({ msg: msg, nickname: socket.nickname });
    newMsg.save(function(err) {
      if (err) { throw err; }
    });
    // Emit message to front end to display
    io.sockets.emit('new message', { msg: msg, nickname: socket.nickname });
  });
  // Function to disconnect and make user poof disapear
  socket.on('disconnect', function(data) {
    if ( !socket.nickname ) { return; }
      delete users[socket.nickname];
      updateNicknames();
  });
});

// router
app.use('/', router);

// Port to listen on
server.listen(process.env.PORT || 1337);
