/*
 * logic.js
 * Core logic and other game objects: Player, Card, Character
 */

;define(["./utils"],
function (utils) {
  "use strict";
  var create_2d_array = utils.create_2d_array;
  utils = undefined;

  /*
   * Card (name)
   *
   */
  var Card = function Card (name) {
    this.name = name;
  };  // End Card constructor

  /*
   * Character (const_data)
   * Construct a new character, which is not initialized.
   * Args:
   *   const_data: data about this character.
   */
  var Character = function Character (const_data) {
    // CONSTANT PUBLIC MEMBERS
    this.id = const_data.id;
    this.name = const_data.name;
    this.init_hp = const_data.init_hp;
    this.max_hp = const_data.max_hp;
    this.mov = const_data.mov;
    this.inherent_skills = const_data.inherent_skills;

    // VOLATILE PUBLIC MEMBERS
    this.pos = null;
    this.hp = null;
    this.sp = null;

  };  // End Character constructor

  /*
   * Player (id, main_character, cards)
   * Construct and initialize a new player.
   * Args:
   *   id: the player id
   *   main_character: a Character object
   *   cards: the card set of the player
   */
  var Player = function Player (id, main_character, cards) {
    // PUBLIC MEMBERS
    this.id = id;
    this.main_character = main_character;
    this.cards = cards;
  };

  var Core = {};
  Core.MainStateEnum = Object.freeze({
                                        INIT: 0,
                                        GAME: 1,
                                      });
  Core.BoardSize = [/* row: */ 11, /* column: */ 11];

  var EmulatedCoreServer = function EmulatedCoreServer () {
    var send_queue = [];
    var game_state = {
                        main: Core.MainStateEnum.INIT,
                        player_to_client: {}, 
                        players: [],
                        player_is_init: [],
                        turn_id: null,
                        first_player_id: null,
                        current_player_id: null
                      };

    this.push_send_queue = function (client_id, type, content) {
      send_queue.push([client_id, JSON.stringify([type, content])]);
    };
    
    // TODO: remove this method
    this.get_game_state = function () {
      return game_state;
    };

    // Receive JSON-formatted request
    this.receive = function (client_id, json_request) {
      // json_request: [cmd_name, content]
      var request = JSON.parse(json_request);
      var callback = this["handle_" + request[0]];
      if (callback !== undefined) {
        callback.call(this, client_id, request[1]);
      }
    };

    // Send JSON-formatted command
    this.send_cmd = function (client_id) {
      for (var i = 0; i < send_queue.length; i++) {
        if (send_queue[i][0] === client_id) {
          return send_queue.splice(i, 1)[0][1];
        }
      }
      return null;
    };

    // get the total number of players
    this.get_num_players = function () {
      return game_state.players.length;
    };

    // get a specific player
    this.get_player = function (player_id) {
      return game_state.players[player_id - 1];
    };

    // get the current player
    this.get_current_player = function () {
      return this.get_player(game_state.current_player_id);
    };

    var _init_character = function (character, init_pos) {
      // initialize character status
      character.pos = [init_pos[0], init_pos[1]];
      character.hp = character.init_hp;
      character.sp = 0;
    };

    // finish init and start the game
    this.start_game = function (first_player_id) {
      game_state.main = Core.MainStateEnum.GAME;
      game_state.turn_id = 1;
      game_state.first_player_id = first_player_id;
      game_state.current_player_id = first_player_id;

      this.push_send_queue( Number(game_state.player_to_client[first_player_id]),
                            "ask_movement",
                            { player_id: game_state.current_player_id });
    };

    // hand over the control to the next player.
    this.to_next_player = function () {
      game_state.current_player_id += 1;
      if (game_state.current_player_id > this.get_num_players()) {
        game_state.current_player_id = 1;
      }
      if (game_state.current_player_id === game_state.first_player_id) {
        game_state.turn_id += 1;
      }

      this.push_send_queue( Number(game_state.player_to_client[game_state.current_player_id]),
                            "ask_movement",
                            { player_id: game_state.current_player_id });
    };

    // COMMAND report_new_player: add a new player in the init state
    // content: { "character": ..., "cards": ... }
    this.handle_report_new_player = function (client_id, content) {
      if (game_state.main !== Core.MainStateEnum.INIT) {
        throw new Error("CoreClient.report_new_player: not allowed.");
      }
      var player = new Player(game_state.players.length + 1, content.character, content.cards);
      var player_id = game_state.players.length + 1;
      game_state.players.push(player);
      game_state.player_is_init.push(false);
      game_state.player_to_client[String(player_id)] = client_id;
      this.push_send_queue(client_id, "tell_player_id", { player_id: player_id });
      this.push_send_queue(client_id, "ask_init_position", { player_id: player_id });
    };

    // COMMAND report_init_position: report the init position of a player
    // content: { "player_id": ..., "pos": ... }
    this.handle_report_init_position = function (client_id, content) {
      // FIXME: validate player_id with client_id
      _init_character.call(this, this.get_player(content.player_id).main_character, content.pos);
      game_state.player_is_init[content.player_id - 1] = true;
      if (game_state.player_is_init.every(x => !!x)) {
        this.start_game(1);
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
    };
  };

  /*
   * CoreClient
   * The core of game logic.
   */
  var CoreClient = function CoreClient () {
    var client_id = null;
    var client_state = null;
    var pending_cmds = null;
    var server = null;

    this.init = function (server_, client_id_) {
      var self = this;
      client_id = client_id_;
      client_state = {
                        player_id: null
                      };
      pending_cmds = [];
      server = server_;
      window.setInterval( function () { 
                            return self.receive_cmd();
                          }, 200);
    };

    // Send JSON-formatted request
    this.send_request = function (type, content) {
      server.receive(client_id, JSON.stringify([type, content]));
    };

    // Receive JSON-formatted commands
    this.receive_cmd = function () {
      var loop = true;
      while (loop) {
        var json_cmd = server.send_cmd(client_id);
        if (!!json_cmd) {  // if receive a cmd
          var cmd = JSON.parse(json_cmd);
          if (cmd[0].startsWith("tell_")) {
            if (cmd[0] === "tell_player_id") {
              client_state.player_id = cmd[1].player_id;
            }
          } else {
            pending_cmds.push(cmd);
          }
        } else {
          loop = false;
        }
      }
    };
    
    this.get_game_state = function () {
      // FIXME: add cache mechanism for real servers.
      return server.get_game_state();
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

    this.generate_board_matrix = function () {
      var ch;
      var mat = create_2d_array(Core.BoardSize, null);
      for (var k = 1; k <= this.get_num_players(); k++) {
        ch = this.get_player(k).main_character;
        mat[ch.pos[0]][ch.pos[1]] = ch;
      }
      return mat;
    };

    this.pull_cmd = function () {
      return (pending_cmds.length > 0
              ? pending_cmds.splice(0, 1)[0]
              : null);
    };
  };  // End Core constructor

  // return module object
  return {
    Card: Card,
    Character: Character,
    Core: Core,
    CoreClient: CoreClient,
    EmulatedCoreServer: EmulatedCoreServer,
    Player: Player
  };
  
});
