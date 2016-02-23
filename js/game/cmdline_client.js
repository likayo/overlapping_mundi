/*
 * cmdline_client.js
 * A command line client.
 */

;define(function () {
  "use strict";

  var CmdlineClient = {
    run: function () {
      var socket = io('http://localhost:13140');
      socket.on('news', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
      });

      var command_output = document.getElementById("command_output");
      var command_input = document.getElementById("command_input");

      var submit_command = function () {
        var cmd = command_input.value;

        command_output.innerHTML += "\n" + cmd;
        // a magic that makes the scroll bar to bottom
        command_output.scrollTop = command_output.scrollHeight;
        command_input.value = ""; // clear command input
        return false;
      };

      var parse_command = function (cmd) {
        // TODO 买一本游戏引擎书
      };

      document.getElementById("command_form").onsubmit = submit_command;
      document.getElementById("command_go").onclick = submit_command;
    }
  };

  return {
    CmdlineClient: CmdlineClient
  };
});