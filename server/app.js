"use strict";

var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var CoreServer = require("./core_server");

app.listen(13140);

function handler (req, res) {
  var url = req.url.replace(/\/?(?:\?.*)?$/, "");
  if (url === "/game_state.js") {
    fs.readFile(__dirname + url,
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end("Error loading " + url);
        }
        res.writeHead(200);
        res.end(data);
      }
    );
  } else if (url.startsWith("/data")) {
    console.log(__dirname + url);
    fs.readFile(__dirname + url,
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end("Error loading " + url);
        }
        res.writeHead(200, {
          // Website you wish to allow to connect
          "Access-Control-Allow-Origin": "*",
          // // Request methods you wish to allow
          "Access-Control-Allow-Methods": "GET"
        });
        res.end(data);
      }
    );
  } else {
    fs.readFile(__dirname + './index.html',
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
      }
    );
  }
}

var data_characters = require("./data/characters");
var data_cards = require("./data/cards");
var core_server = new CoreServer(data_characters, data_cards);

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
