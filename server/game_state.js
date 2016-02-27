/*
 * game_state.js
 * This file will be shared by server and client.
 */

var GameState = function () {
  "use strict";

  var on_server_side = (typeof module !== "undefined");
  console.log("on_server_side: " + on_server_side.toString());

  var decorate = function (obj, fname, cb) {
    var f = obj[fname];
    obj[fname] = function () {
      cb(obj, fname, arguments);
      f.apply(obj, arguments);
    };
  };

  var create_2d_array = function (dim, init) {
    var arr = [];
    for (var i = 0; i < dim[0]; i++) {
      arr.push(new Array(dim[1]));
      for (var j = 0; j < dim[1]; j++) {
        arr[i][j] = init;
      }
    }
    return arr;
  };

  /*
   * Card (name)
   *
   */
  var Card = function Card (id, name) {
    // CONSTANT PUBLIC MEMBERS
    this.id = id;
    this.name = name;
  };  // End Card constructor

  /*
   * Character (const_data)
   * Construct a new character, which is not initialized.
   * Args:
   *   const_data: data about this character.
   */
  var Character = function Character (id, name) {
    // CONSTANT PUBLIC MEMBERS
    this.id = id;
    this.name = name;

    // VOLATILE PUBLIC MEMBERS
    this.pos = null;
    this.hp = null;
    this.sp = null;
    this.buffs = null;
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

  var GameState = function GameState (db) {
    var s = {
              main: GameState.MainStateEnum.INIT,
              player_to_client: {}, 
              players: [],
              player_is_init: [],
              turn_id: null,
              first_player_id: null,
              current_player_id: null
            };

    this.get = function (attr) {
      return s[attr];
    };

    // get the total number of players
    this.get_num_players = function () {
      return s.players.length;
    };

    // get a specific player
    this.get_player = function (player_id) {
      return s.players[player_id - 1];
    };

    // get a specific player
    this.client_to_player_id = function (client_id) {
      for (var player_id in s.player_to_client) {
        if (s.player_to_client[player_id] === client_id) {
          return Number.parseInt(player_id);
        }
      }
      return -1;
    };

    // get the current player
    this.get_current_player = function () {
      return this.get_player(s.current_player_id);
    };

    this.player_to_client = function (player_id) {
      return Number(s.player_to_client[player_id]);
    };

    this.get_board_matrix = function () {
      var ch;
      var mat = create_2d_array(GameState.BoardSize, null);
      for (var k = 1; k <= this.get_num_players(); k++) {
        ch = this.get_player(k).main_character;
        mat[ch.pos[0]][ch.pos[1]] = ch;
      }
      return mat;
    };

    /*
     * NOTE: All follwowing functions will be synchronized to all clients by RPC.
     */

    this.add_new_player = function (client_id, main_character, cards) {
      var player_id = s.players.length + 1;
      var player = new Player(player_id, main_character, cards);
      s.players.push(player);
      s.player_is_init.push(false);
      s.player_to_client[String(player_id)] = client_id;
    };
    this.add_new_player.rpc_enabled = true;

    this.init_character = function (player_id, init_pos) {
      // initialize character status
      var character = this.get_player(player_id).main_character;
      character.pos = [init_pos[0], init_pos[1]];
      character.hp = db.characters.by_id(character.id).init_hp;
      character.sp = 0;
      character.buffs = []; // TODO: add init buff
      s.player_is_init[player_id - 1] = true;
    };
    this.init_character.rpc_enabled = true;

    // finish init and start the game
    this.start_game = function (first_player_id) {
      s.main = GameState.MainStateEnum.GAME;
      s.turn_id = 1;
      s.first_player_id = first_player_id;
      s.current_player_id = first_player_id;
    };
    this.start_game.rpc_enabled = true;

    this.move = function (player_id, pos) {
      // TODO
    };
    this.move.rpc_enabled = true;

    // hand over the control to the next player.
    this.to_next_player = function () {
      s.current_player_id += 1;
      if (s.current_player_id > this.get_num_players()) {
        s.current_player_id = 1;
      }
      if (s.current_player_id === s.first_player_id) {
        s.turn_id += 1;
      }
    };
    this.to_next_player.rpc_enabled = true;

    // Used to load a snapshot
    this.__copy_from = function (s_) {
      s = s_;
    };
    this.__copy_from.rpc_enabled = true;

    if (on_server_side) {
      // If this code is run on server side, decorate RPC functions
      this.set_rpc_callback = function (rpc_cb) {
        if (this.rpc_cb === undefined) {
          this.rpc_cb = rpc_cb;
          for (var fname in this) {
            if (this[fname].rpc_enabled === true) {
              console.log("  " + fname + " decorated");
              decorate(this, fname, rpc_cb);
            }
          }
        } else {
          throw new Error("RPC callback cannot be set twice.");
        }
      };

      // Take a snapshot of the game state.
      this.refresh = function () {
        this.__copy_from(s);
      };
    }
  };

  GameState.Card = Card;
  GameState.Player = Player;
  GameState.Character = Character;
  GameState.MainStateEnum = Object.freeze({
                                            INIT: 0,
                                            GAME: 1,
                                          });
  GameState.BoardSize = [/* row: */ 11, /* column: */ 11];

  return GameState;
}();

if (typeof module !== "undefined") {
  module.exports = GameState;
}
