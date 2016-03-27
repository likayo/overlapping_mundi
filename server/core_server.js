"use strict";

var GameState = require("./game_state");
var db = require("./db_");
var omg = require("./omg");

var ServerSideRpcManager = function ServerSideRpcManager () {
  var rpc_state = {
    snapshot: 1,
    version: 0
  };
  var sockets = [];
  var s = null;

  this.get_state = function () {
    return rpc_state;
  };

  this.add_socket = function(soc) {
    sockets.push(soc);
  };

  this.bind = function (game_state) {
    s = game_state;
    s.set_rpc_callback(
      function (obj, fname, args) {
        console.log(fname + " called with args " + JSON.stringify(Array.from(args)));
        rpc_state.version += 1;
        console.log("RPC version: " + JSON.stringify(rpc_state));
        for (var i = 0; i < sockets.length; i++) {
          var socket = sockets[i];
          socket.emit("rpc", [rpc_state, fname, Array.from(args)]);
        }
      }
    );
  };

  this.take_snapshot_and_sync = function () {
    rpc_state.snapshot += 1;
    rpc_state.version = -1;
    s.refresh();
  };
};

var CoreServer = function CoreServer () {
  var client_to_socket = {};

  var game_state = new GameState(db);
  var rpc_manager = new ServerSideRpcManager();
  rpc_manager.bind(game_state);

  // Receive request
  this.receive = function (client_id, request) {
    // request: [cmd_name, content]
    var callback = this["handle_" + request[0]];
    if (callback !== undefined) {
      callback.call(this, client_id, request[1]);
    }
  };

  this.send_cmd = function (client_id, type, content) {
    client_to_socket[String(client_id)].emit("server_cmd", [client_id, type, content]);
  };

  this.register_client = function (client_id, socket) {
    client_to_socket[String(client_id)] = socket;
    rpc_manager.add_socket(socket);
    rpc_manager.take_snapshot_and_sync();
    this.send_cmd(client_id, "ask_player_build", {});
  };

  // COMMAND report_new_player: add a new player in the init state
  // content: { "character": ..., "cards": ... }
  this.handle_report_new_player = function (client_id, content) {
    if (game_state.get("main") !== GameState.MainStateEnum.INIT) {
      throw new Error("CoreClient.report_new_player: not allowed.");
    }
    game_state.add_new_player(client_id, content.character, content.cards);
    var new_player_id = game_state.client_to_player_id(client_id);
    this.send_cmd(client_id, "ask_init_position", { player_id: new_player_id });
  };

  // COMMAND report_init_position: report the init position of a player
  // content: { "player_id": ..., "pos": ... }
  this.handle_report_init_position = function (client_id, content) {
    // FIXME: validate player_id with client_id
    game_state.init_character(content.player_id, content.pos)
    if (game_state.get_num_players() >= 2 &&
        game_state.get("player_is_init").every(x => !!x)) {
      game_state.start_game(1);
      // TODO: draw card phase
      this.send_cmd(game_state.player_to_client(game_state.get("first_player_id")),
                    "ask_movement",
                    { player_id: game_state.get("current_player_id") });
    }
  };
  
  // COMMAND report_movement: report the movement of a player's main character
  // content: { "player_id": ..., "pos": ... }
  // If pos is null, that means user cancelled the movement.
  this.handle_report_movement = function (client_id, content) {
    // FIXME: validate player_id with client_id
    if (content.pos === null) {
      ;
    } else {
      this.get_player(content.player_id).main_character.pos = content.pos;
    }
    this.to_next_player();
    // TODO
    // this.push_send_queue( Number(s.player_to_client[s.current_player_id]),
    //                       "ask_movement",
    //                       { player_id: s.current_player_id });
  };
};

module.exports = CoreServer;
