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
    this.player = null;   // binded to the owner. Changed in Player()
    this.pos = null;
    this.hp = null;
    this.sp = null;

    // initialize character status
    this.init = function (pos) {
      this.player = null;
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

    this.main_character.player = this;  // bind the character
  };


  /*
   * Core
   * The core of game logic.
   */
  var Core = function Core () {
    var state = null;
    var pending_cmds = null;

    this.init = function () {
      state = {
                main: Core.MainStateEnum.INIT,
                players: [],
                player_is_init: [],
                turn_id: null,
                first_player_id: null,
                current_player_id: null
              };
      pending_cmds = [];
    };

    // add a new player in the init state
    this.report_new_player = function (character, cards) {
      if (state.main !== Core.MainStateEnum.INIT) {
        throw new Error("Core.report_new_player: not allowed.");
      }
      var player = new Player(state.players.length + 1, character, cards);
      var player_id = state.players.length + 1;
      state.players.push(player);
      state.player_is_init.push(false);
      pending_cmds.push(["ask_init_position", player_id]);
    };

    this.report_init_position = function (player_id, pos) {
      var is_true = function (x) {
        return !!x;
      };
      this.get_player(player_id).main_character.init(pos);
      state.player_is_init[player_id - 1] = true;
      if (state.player_is_init.every(is_true)) {
        this.start_game(1);
      }
    };

    // finish init and start the game
    this.start_game = function (first_player_id) {
      state.main = Core.MainStateEnum.GAME;
      state.turn_id = 1;
      state.first_player_id = first_player_id;
      state.current_player_id = first_player_id;

      pending_cmds.push(["ask_movement", state.current_player_id]);
    };

    // get the total number of players
    this.get_num_players = function () {
      return state.players.length;
    };

    // get a specific player
    this.get_player = function (player_id) {
      return state.players[player_id - 1];
    };

    // get the current player
    this.get_current_player = function () {
      return this.get_player(state.current_player_id);
    };

    this.get_board_matrix = function () {
      var ch;
      var mat = create_2d_array(Core.BoardSize, null);
      for (var k = 1; k <= this.get_num_players(); k++) {
        ch = this.get_player(k).main_character;
        mat[ch.pos[0]][ch.pos[1]] = ch;
      }
      return mat;
    };

    this.report_movement = function (player_id, pos) {
      this.get_player(player_id).main_character.pos = pos;
      this.to_next_player();
    };

    // hand over the control to the next player.
    this.to_next_player = function () {
      state.current_player_id += 1;
      if (state.current_player_id > this.get_num_players()) {
        state.current_player_id = 1;
      }
      if (state.current_player_id === state.first_player_id) {
        state.turn_id += 1;
      }

      pending_cmds.push(["ask_movement", state.current_player_id]);
    };

    this.pull_cmd = function () {
      return (pending_cmds.length > 0
              ? pending_cmds.splice(0, 1)[0]
              : null);
    };
  };  // End Core constructor
  Core.MainStateEnum = Object.freeze({
                                        INIT: 0,
                                        GAME: 1,
                                      });
  Core.BoardSize = [/*row: */ 11, /*column: */11];

  // return module object
  return {
    Card: Card,
    Character: Character,
    Core: Core,
    Player: Player
  };
  
});
