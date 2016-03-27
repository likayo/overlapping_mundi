/*
 * cmdline_client.js
 * A command line client.
 */

;define(["./utils", "./db", "game_state"],
function (utils, db, GameState) {
  "use strict";
  var create_2d_array = utils.create_2d_array;
  utils = undefined;

  /*
   * ClientSideRpcManager
   * Manage the RPCs to GameState object.
   */
  var ClientSideRpcManager = function ClientSideRpcManager (game_state_) {
    var rpc_state = {
      snapshot: -1,
      version: -1
    };
    var game_state = game_state_;
    var callbacks = {};
    // var server = null;

    this.handle = function (descriptor) {
      var server_state = descriptor[0];
      var fname = descriptor[1];
      var args = descriptor[2];

      if (server_state.version === 0) { // new snapshot
        console.log("GS Snapshot " + server_state.snapshot.toString());
      } else {
        console.log("GS Update " + server_state.snapshot.toString() + "." + server_state.version.toString());
      }
      console.log("RPC: " + JSON.stringify(descriptor.splice(1)));
      game_state[fname].apply(game_state, args);
      if (callbacks[fname] !== undefined) {
        callbacks[fname].call(null, args, server_state, game_state);
      }

      rpc_state = server_state; // update local state
    };

    /*
     * ClientSideRpcManager.when_server(fname, callback)
     * Set a callback function that is called *AFTER* an RPC call happens.
     * Args:
     *    fname: the name of the RPC call. The callback function will only be
     *      triggered by RPCs of this type.
     *    callback: function(args, rpc_state, game_state)
     */
    this.when_server = function (fname, callback) {
      callbacks[fname] = callback;
    };
  };

  /*
   * SocketCoreClient
   * The core of game logic.
   */
  var SocketCoreClient = function SocketCoreClient () {
    var client_id = null;
    var client_state = null;
    var pending_ui_cmds = null;
    var server = null;
    var game_state = null;
    var rpc_manager = null;

    this.init = function (url, client_id_) {
      var self = this;
      client_id = client_id_;
      client_state = {
                        login_success: false,
                        player_id: null
                      };
      pending_ui_cmds = [];
      game_state = new GameState(db);

      server = io(url);
      server.on("connect", function () {
        server.emit("login", client_id);
      });

      server.on("login_approve", function () {
        client_state.login_success = true;
        pending_ui_cmds.push(["tell_login_success", { client_id: client_id }]);
      });

      // Handle commands from server
      server.on("server_cmd", function (cmd) {
        console.log("Server command: " + JSON.stringify(cmd));
        var cmd_client_id = cmd[0];
        var type = cmd[1];
        var content = cmd[2];

        if (type.startsWith("tell_")) {
          if (type === "tell_player_id") {
            // client_state.player_id = content.player_id;
            throw "up";
          }
        } else if (type === "ask_player_build") {
          var reimu_data = db.characters.by_name("博丽灵梦");
          self.report_new_player(new GameState.Card(reimu_data.id, reimu_data.name), []);
        } else if (type === "ask_init_position") {
          var mat = create_2d_array(GameState.BoardSize, false);
          for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 6; j++) {
              mat[(i < 3? i: i + 5)][(j < 3? j: j + 5)] = true;
            }
          }
          pending_ui_cmds.push(["ask_init_position",
                                { player_id: content.player_id,
                                  candidates: mat,
                                  cancelable: false }]);
        } else {
          pending_ui_cmds.push([type, content]);
        }
      });

      // Init RPC manager
      this._init_rpc_manager();
    };

    this._init_rpc_manager = function () {
      rpc_manager = new ClientSideRpcManager(game_state);
      rpc_manager.when_server("add_new_player", function (args, rpc_state, game_state) {
        // after
        var arg_client_id = args[0];
        if (arg_client_id === client_id) {
          client_state.player_id = game_state.client_to_player_id(arg_client_id);
          pending_ui_cmds.push(["tell_player_id", { player_id: client_state.player_id }]);
        }
      });

      server.on("rpc", function (rpc_descriptor) {
        // console.log("rpc_descriptor " + JSON.stringify(rpc_descriptor));
        rpc_manager.handle(rpc_descriptor);
      });
    };

    // Send request
    // Return: success or not
    this.send_request = function (type, content) {
      if (client_state.login_success){
        server.emit("client_request", [client_id, type, content]);
        return true;
      } else {
        return false;
      }
    };

    // COMMAND report_new_player: add a new player in the init state
    this.report_new_player = function (character, cards) {
      this.send_request("report_new_player",
                        { character: character, cards: cards });
    };

    // COMMAND report_init_position: report the init position of a player
    this.report_init_position = function (player_id, pos) {
      this.send_request("report_init_position",
                        { player_id: player_id, pos: pos });
    };

    // COMMAND report_movement: report the movement of a player's main character
    // If pos is null, that means the movement is cancelled.
    this.report_movement = function (player_id, pos) {
      if (pos === null) {
        this.send_request("report_movement",
                          { player_id: player_id, pos: null });
      } else {
        this.send_request("report_movement",
                          { player_id: player_id, pos: pos });
      }
    };

    // get the total number of players
    this.get_num_players = function () {
      return this.get_game_state().players.length;
    };

    // get a specific player
    this.get_player = function (player_id) {
      return this.get_game_state().players[player_id - 1];
    };

    // get the current player
    this.get_current_player = function () {
      return this.get_player(this.get_game_state().current_player_id);
    };

    this.pull_ui_cmd = function () {
      return (pending_ui_cmds && pending_ui_cmds.length > 0
              ? pending_ui_cmds.splice(0, 1)[0]
              : null);
    };
  };  // End SocketCoreClient constructor

  /*
   * A command-line om client
   */
  var CmdlineClient = {
    core_client: null,
    pending_ui_cmds: null,
    current_interaction: null,

    // Add text to the output panel.
    add_output: function (s) {
      var command_output = document.getElementById("command_output");
      command_output.innerHTML += "\n" + s;
      // a magic that makes the scroll bar to bottom
      command_output.scrollTop = command_output.scrollHeight;
    },

    // Return: the selection is initiated or not
    start_position_selection: function (candidates, cancelable, msg, callback) {
      if (this.current_interaction === null) {
        this.add_output(msg);
        this.current_interaction = {
          type: "position_selection",
          candidates: candidates,
          cancelable: cancelable,
          callback: callback
        };
        return true;
      } else {
        console.log("There is already a selection");
        return false;
      }
    },

    // Return: finish or not
    finish_position_selection: function (pos) {
      if (this.current_interaction && this.current_interaction.type === "position_selection") {
        if (pos === null) {
          if (this.current_interaction.cancelable) {
            this.current_interaction.callback.call(null, pos);
            this.current_interaction = null;
            return true;
          } else {
            this.add_output("You can't cancel the selection.");
            return false;
          }
        } else if (this.current_interaction.candidates[pos[0]][pos[1]]) {
          this.current_interaction.callback.call(null, pos);
          this.current_interaction = null;
          return true;
        } else {
          this.add_output("Invalid position selected.");
          return false;
        }
      } else {
        this.add_output("You don't need to select a position now.")
        return false;
      }
    },

    receive_ui_cmd: function () {
      while (true) {
        var cmd = this.core_client.pull_ui_cmd();
        if (cmd) {
          this.pending_ui_cmds.push(cmd);
        } else {
          break;
        }
      }
      for (var i = 0; i < this.pending_ui_cmds.length; i++) {
        var success = this.handle_ui_cmd(this.pending_ui_cmds[i]);
        if (success) {
          this.pending_ui_cmds.splice(i, 1);
          i--;
        }
      }
    },

    /* 
     * CmdlineClient.handle_ui_cmd();
     * Handle a pending UI command.
     * Return: success or not.
     */
    handle_ui_cmd: function (cmd) {
      switch (cmd[0]) {
        case "tell_login_success":
          return this.handle_tell_login_success(cmd);
        case "tell_player_id":
          return this.handle_tell_player_id(cmd);
        case "ask_init_position":
          return this.handle_ask_init_position(cmd);
        case "ask_movement":
          throw "up";
          return this.handle_ask_movement(cmd);
        default:
          throw new Error("handle_ui_cmd: unknwon cmd type " + cmd[0]);
      }
    },

    handle_tell_login_success: function (cmd) {
      this.add_output("Login as client " + cmd[1].client_id.toString());
      return true;
    },

    handle_tell_player_id: function (cmd) {
      this.add_output("My player_id is " + cmd[1].player_id.toString());
      return true;
    },

    handle_ask_init_position: function (cmd) {
      var self = this;
      var callback = function (pos) {
        self.core_client.report_init_position(cmd[1].player_id, pos);
      };
      return this.start_position_selection(cmd[1].candidates, cmd[1].cancelable,
                                            "Select an initial position:",
                                            callback);
    },

    run: function () {
      var self = this;
      this.core_client = new SocketCoreClient();
      this.pending_ui_cmds = [];
      this.current_interaction = null;

      var submit_command = function () {
        var command_input = document.getElementById("command_input");
        var cmd = parse_command(command_input.value);
        var type = (cmd? cmd[0]: "I&*@F&Q");
        var content = (cmd? cmd[1]: {});
        self.add_output(">> " + command_input.value);
        switch (type) {
          case "c":
            self.core_client.init('http://localhost:13140/', content["client_id"]);
            break;
          case "goto":
            self.finish_position_selection(content.pos);
            break;
          case "stayhere":
            self.finish_position_selection(null);
            break;
          default:
            self.add_output("Failed to recognize this command.");
            break;
        };

        command_input.value = ""; // clear command input
        return false; // don't submit the form
      };

      var parse_command = function (cmd) {
        // TODO 买一本游戏引擎书
        var cmdsplit = cmd.split(" ");
        var type = cmdsplit[0];
        switch (type) {
          case "c":
            return [type, { client_id: Number.parseInt(cmdsplit[1]) }];
          case "goto":  // pos is 1-based.
            return [type, { pos: [Number.parseInt(cmdsplit[1]) - 1,
                                  Number.parseInt(cmdsplit[2]) - 1] }];
          case "stayhere":
            return [type];
          default:
            return null;
        }
      };

      document.getElementById("command_form").onsubmit = submit_command;
      document.getElementById("command_go").onclick = submit_command;
      window.setInterval( function () { 
                            return self.receive_ui_cmd();
                          }, 200);
    }
  };

  return {
    CmdlineClient: CmdlineClient
  };
});