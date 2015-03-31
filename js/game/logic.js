// logic.js
;define(function () {
  "use strict";

  /*
   * Card
   *
   *
   */
  var Card = (function () {

    // Constructor
    function Card (name) {
      this.name = name;
    };  // End Card constructor

    return Card;

  })();


  var Character = (function () {
    /*
     * Character (const_data)
     * Construct a new character, which is not initialized.
     * Args:
     *   const_data: data about this character.
     */
    function Character (const_data) {
        // CONSTANT PUBLIC MEMBERS
        this.id = const_data.id;
        this.name = const_data.name;
        this.init_hp = const_data.init_hp;
        this.max_hp = const_data.max_hp;
        this.mov = const_data.mov;
        this.inherent_skills = const_data.inherent_skills;

        // VOLATILE PUBLIC MEMBERS
        this.player = null;   // changed in Player()
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
    }  // End Character constructor
    return Character;

  })();


  var Player = (function () {
    /*
     * Player (id, main_character, cards)
     * Construct and initialize a new player.
     * Args:
     *   id: the player id
     *   main_character: a Character object
     *   cards: the card set of the player
     */
    function Player (id, main_character, cards) {
      // PUBLIC MEMBERS
      this.id = id;
      this.main_character = main_character;
      this.cards = cards;

      this.main_character.player = this;  // 

    }  // End Player constructor
    return Player;

  })();


  /*
   * Core
   * The core of game logic.
   */
  var Core = (function () {
    function Core () {
      var state = {
                    main: Core.MainStateEnum.INIT,
                    players: [],
                    turn_id: null,
                    first_player_id: null,
                    current_player_id: null
                  };

      // add a new player in the init state
      this.add_player = function (character, cards) {
        if (state.main !== Core.MainStateEnum.INIT) {
          throw new Error("Core.add_player: not allowed.");
        }
        var player = new Player(state.players.length + 1, character, cards);
        state.players.push(player);
        return player;
      };

      // finish init and start the game
      this.start_game = function (first_player_id) {
        state.main = Core.MainStateEnum.GAME;
        state.turn_id = 1;
        state.first_player_id = first_player_id;
        state.current_player_id = first_player_id;
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

      // hand over the control to the next player.
      this.to_next_player = function () {
        state.current_player_id += 1;
        if (state.current_player_id > this.get_num_players()) {
          state.current_player_id = 1;
        }
        if (state.current_player_id === state.first_player_id) {
          state.turn_id += 1;
        }
      };
    }  // End Core constructor
    Core.MainStateEnum = Object.freeze({
                                          INIT: 0,
                                          GAME: 1,
                                        });
    return Core;

  })();

  // return module object
  return {
    Card: Card,
    Character: Character,
    Core: Core,
    Player: Player
  };
  
});
