"use strict";

var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var CoreServer = require("./core_server");

app.listen(13140);

function handler (req, res) {
  var url = req.url.replace(/\/?(?:\?.*)?$/, "");
  var fn = null;
  var cors = false; // Cross-Orgin Resource Sharing
  if (url === "/game_state.js") {
    fn = __dirname + url;
  } else if (url.startsWith("/data")) {
    fn = __dirname + url;
    cors = true;
  } else {
    fn = __dirname + "./index.html";
  }

  console.log(fn);
  fs.readFile(fn, function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end("Error loading " + url);
    }
    if (cors) {
      res.writeHead(200, {
        // Website you wish to allow to connect
        "Access-Control-Allow-Origin": "*",
        // // Request methods you wish to allow
        "Access-Control-Allow-Methods": "GET"
      });
    } else {
      res.writeHead(200);
    }
    res.end(data);
  });
};

var core_server = new CoreServer();

io.on('connection', function (socket) {
  socket.on('login', function (client_id) {
    console.log(client_id.toString() + " login");
    socket.emit("login_approve");
    core_server.register_client(client_id, socket);
  });
  socket.on("client_request", function (req) {
    // console.log(req);
    core_server.receive(req[0], [req[1], req[2]]);
  });
});
