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

    // initialize character status
    this.init = function (pos) {
      this.pos = pos;
      this.hp = this.init_hp;
      this.sp = 0;
    };
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
                        players: [],
                        player_is_init: [],
                        turn_id: null,
                        first_player_id: null,
                        current_player_id: null
                      };

    this.push_send_queue = function (type, content) {
      send_queue.push(JSON.stringify([type, content]));
    };
    
    // TODO: remove this method
    this.get_game_state = function () {
      return game_state;
    };

    // Receive JSON-formatted request
    this.receive = function (json_request) {
      var request = JSON.parse(json_request);
      var cb = this["handle_" + request[0]];
      if (cb !== undefined) {
        cb.call(this, request[1]);
      }
    };

    // Send JSON-formatted command
    this.send_cmd = function (send) {
      return (send_queue.length > 0
              ? send_queue.splice(0, 1)[0]
              : null);
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

    // finish init and start the game
    this.start_game = function (first_player_id) {
      game_state.main = Core.MainStateEnum.GAME;
      game_state.turn_id = 1;
      game_state.first_player_id = first_player_id;
      game_state.current_player_id = first_player_id;

      this.push_send_queue( "ask_movement",
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

      this.push_send_queue( "ask_movement",
                            { player_id: game_state.current_player_id });
    };

    // COMMAND report_new_player: add a new player in the init state
    this.handle_report_new_player = function (content) {
      if (game_state.main !== Core.MainStateEnum.INIT) {
        throw new Error("CoreClient.report_new_player: not allowed.");
      }
      var player = new Player(game_state.players.length + 1, content.character, content.cards);
      var player_id = game_state.players.length + 1;
      game_state.players.push(player);
      game_state.player_is_init.push(false);
      this.push_send_queue("tell_player_id", { player_id: player_id });
      this.push_send_queue("ask_init_position", { player_id: player_id });
    };

    // COMMAND report_init_position: report the init position of a player
    this.handle_report_init_position = function (content) {
      var is_true = function (x) {
        return !!x;
      };
      this.get_player(content.player_id).main_character.init(content.pos);
      game_state.player_is_init[content.player_id - 1] = true;
      if (game_state.player_is_init.every(is_true)) {
        this.start_game(1);
      }
    };
    
    // COMMAND report_movement: report the movement of a player's main character
    this.handle_report_movement = function (content) {
      this.get_player(content.player_id).main_character.pos = content.pos;
      this.to_next_player();
    };
  };

  /*
   * CoreClient
   * The core of game logic.
   */
  var CoreClient = function CoreClient () {
    var client_state = null;
    var pending_cmds = null;
    var server = null;

    this.init = function () {
      var self = this;
      client_state = {
                        player_id: null
                      };
      pending_cmds = [];
      server = new EmulatedCoreServer();
      window.setInterval( function () { 
                            return self.receive_cmd();
                          }, 200);
    };

    // Send JSON-formatted request
    this.send_request = function (type, content) {
      server.receive(JSON.stringify([type, content]));
    };

    // Receive JSON-formatted commands
    this.receive_cmd = function () {
      while (true) {
        var json_cmd = server.send_cmd();
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
          break;
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
    this.report_movement = function (player_id, pos) {
      this.send_request("report_movement",
                        { player_id: player_id, pos: pos });
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
    Player: Player
  };
  
});
