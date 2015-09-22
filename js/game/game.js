/*
 * game.js
 * Game main loop.
 */

;define(["lkyengine", "./logic", "./ui", "./data", "./utils"],
function (LkyEngine, logic, ui, data, utils) {
  "use strict";
  var Card = logic.Card;
  var create_2d_array = utils.create_2d_array;
  utils = undefined;

  /*
   *  PRIVATE MEMBERS
   */
  var engine = null;
  // Sprites
  var btn_start_game_sprite = null,
      map_sprite = null,
      reimu_sprite = null,
      marisa_sprite = null,
      card_stack_sprite = null,
      cards_sprite = null,
      mark_sprites = null;
  // UI elements
  var ui_field = null;
  // Core logic
  var core = null;
  // Watchers of user input
  var watchers = null;
  // Commands from core logic that is pending
  var pending_cmds = null;
  // UI state
  var state = {
    MainEnum: Object.freeze({
                              TITLE: 0,
                              GAME: 1,
                            }),
    // Will be called at the start of game
    reset: function (main_state) {
      switch (main_state) {
        case this.MainEnum.TITLE:
          this.main               = this.MainEnum.TITLE;
          this.btn_start_game_clicked = false;
          break;
        case this.MainEnum.GAME:
          this.main               = this.MainEnum.GAME;
          this.player_cards       = [];
          this.player_card_stack  = [new Card("A"), new Card("B"), new Card("C"),
                                     new Card("AA"), new Card("BB"), new Card("CC")];
          break;
        default:
          throw "state.reset: illegal main state.";
      }
    }
  };
  // Summarize user inputs in a frame
  var user_input = {
    // Will be called at the start of each frame
    reset: function () {
      this.new_game_clicked   = null;
      this.card_stack_clicked = false;
    }
  };

  /*
   *  PRIVATE RENDERING FUNCTION
   */
  var render_cards = function (ctx) {
    // this: cards_sprite
    var i,
        topleft,
        card_size = [60, 80],
        interval = 20;

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth   = 5;
    ctx.font        = this.text_font;
    ctx.textAlign   = "center";
    for (i in this.state.player_cards) {
      topleft = [this.topleft[0] + i * card_size[0] + i * interval,
                 this.topleft[1]];
      ctx.beginPath();
      ctx.fillStyle   = "white";
      ctx.rect(topleft[0], topleft[1], card_size[0], card_size[1]);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle   = "black";
      ctx.fillText(this.state.player_cards[i].name,
                  topleft[0] + card_size[0] / 2,
                  topleft[1] + card_size[1] / 2);
    }
  };

  var render_card_stack = function (ctx) {
    // this: card_stack_sprite
    var i,
        topleft,
        text_font = this.text_font,
        card_size = [60, 80],
        interval = 3,
        n = 5;

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth   = 2;
    ctx.fillStyle   = "white";
    ctx.font        = text_font;
    ctx.textAlign   = "center";
    for (i = n - 1; i >= 0; i--) {
      topleft = [this.topleft[0] + i * interval,
                 this.topleft[1] + i * interval];
      ctx.beginPath();
      ctx.rect(topleft[0], topleft[1], card_size[0], card_size[1]);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "black";
    ctx.fillText("Draw",
                 this.topleft[0] + card_size[0] / 2,
                 this.topleft[1] + card_size[1] / 2);
  };

  var render_bn_start_game = function (ctx) {
    // this: btn_start_game_sprite
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth   = 5;
    ctx.font        = this.text_font;
    ctx.textAlign   = "center";

    ctx.fillStyle   = "white";
    ctx.rect(this.topleft[0], this.topleft[1], this.size[0], this.size[1]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = "black";
    ctx.fillText("Start",
                this.topleft[0] + this.size[0] / 2,
                this.topleft[1] + this.size[1] / 2);
  };

  /*
   *  PRIVATE HANDLER FUNCTION
   */
  var handle_ask_init_position = function (cmd) {
    // this: Game object
    var i, j, mat;
    var watcher;
    var player_id = cmd[1].player_id;

    var watcher_callback = function (game_state, logic_core) {
      // this: Watcher object
      if (this.collector.grid_clicked) {
        logic_core.report_init_position(this.player_id, this.collector.grid_clicked);
        this.ui_element.add_character(logic_core.get_player(this.player_id).main_character);
        this.ui_element.disable_pos_selection();
        return true;  // finish this watcher
      }
      return false;
    };

    if (ui_field.pos_selection_enabled) {   // UI elements occupied
      return false;
    }
    mat = create_2d_array(this.consts.battle_field_size, false);
    for (i = 0; i < 6; i++) {
      for (j = 0; j < 6; j++) {
        mat[(i < 3? i: i + 5)][(j < 3? j: j + 5)] = true;
      }
    }
    ui_field.enable_pos_selection(mat);
    watcher = ui_field.create_watcher(watcher_callback);
    watcher.player_id = player_id;
    watchers.push(watcher);
    return true;
  };  // End handle_ask_init_position()

  var handle_ask_movement = function (cmd) {
    // this: Game object
    var i, j,
        ch,
        player_id = cmd[1].player_id,
        watcher;

    var dfs = function dfs (mat, pos, steps) {
      var i = pos[0], j = pos[1];
      var nrow = mat.length, ncolumn = mat[0].length;
      if (steps !== 0) {
        if (mat[i][j] !== null) {
          return;
        } else if (dfs.result[i][j] <= steps) { // have been visited
          return;
        }
      }
      dfs.result[i][j] = steps;
      if (i - 1 >= 0) {
        dfs(mat, [i - 1, j], steps + 1);
      }
      if (i + 1 < nrow) {
        dfs(mat, [i + 1, j], steps + 1);
      }
      if (j - 1 >= 0) {
        dfs(mat, [i, j - 1], steps + 1);
      }
      if (j + 1 < ncolumn) {
        dfs(mat, [i, j + 1], steps + 1);
      }
    };

    var watcher_callback = function (game_state, logic_core) {
      // this: Watcher object
      if (this.collector.grid_clicked) {
        logic_core.report_movement(this.player_id, this.collector.grid_clicked);
        this.ui_element.disable_pos_selection();
        return true;  // finish this watcher
      } else if (this.collector.canceled) {
        // TODO: cancel button
        this.ui_element.disable_pos_selection();
      }
      return false;
    };

    if (ui_field.pos_selection_enabled) {   // UI elements occupied
      return false;
    }
    // Search available movements
    ch = core.get_player(player_id).main_character;
    dfs.result = create_2d_array(this.consts.battle_field_size, Number.POSITIVE_INFINITY);
    dfs(core.generate_board_matrix(), ch.pos, 0);
    for (i = 0; i < this.consts.battle_field_size[0]; i++) {
      for (j = 0; j < this.consts.battle_field_size[1]; j++) {
        if (1 <= dfs.result[i][j] && dfs.result[i][j] <= ch.mov) {
          dfs.result[i][j] = true;
        } else {
          dfs.result[i][j] = false;
        }
      }
    }
    ui_field.enable_pos_selection(dfs.result, ui.BattleField.Cancelable);
    watcher = ui_field.create_watcher(watcher_callback);
    watcher.player_id = player_id;
    watchers.push(watcher);
    return true;
  };  // End handle_ask_movement()

  var Game = {

    // Graphic constants
    consts: {
      text_font: "12pt 微软雅黑",
      battle_field_size: logic.Core.BoardSize,
      layout: {
        canvas: [800, 750],
        //                tl_x, tl_y, width, height
        btn_start_game:   [ 300, 200, 100, 100],
        card_stack:       [ 400, 200,  80, 100],
        map:              [  20,  20, 700, 700],
        map_grid_size:    [Math.ceil(671 / 11), Math.floor(671 / 11)]
      }
    },

    /*
     * Game.init()
     * Reset the state of game, and initialize the engine and sprites.
     */
    init: function () {
      state.reset(state.MainEnum.TITLE);
      user_input.reset();
      engine.init(this.consts.layout.canvas);
      watchers = [];
      pending_cmds = [];

      btn_start_game_sprite = engine.create_sprite(
                                this.consts.layout.btn_start_game.slice(0, 2),
                                this.consts.layout.btn_start_game.slice(2, 4),
                                0,
                                LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      btn_start_game_sprite.text_font = this.consts.text_font;
      btn_start_game_sprite.set_user_render(render_bn_start_game);
      btn_start_game_sprite.change_handler("click", function (event) {
        user_input.btn_start_game_clicked = true;
      });
    },

    /*
     * Game.init_game()
     * Set the main state to GAME, and initialize necessary sprites, UI elements
     * and core logic.
     */
    init_game: function () {
      state.reset(state.MainEnum.GAME);
      user_input.reset();

      if (btn_start_game_sprite) {
        engine.remove_sprite(btn_start_game_sprite);
      }

      card_stack_sprite = engine.create_sprite(
                              this.consts.layout.card_stack.slice(0, 2),
                              this.consts.layout.card_stack.slice(2, 4),
                              50,
                              LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      card_stack_sprite.text_font = this.consts.text_font;
      card_stack_sprite.set_user_render(render_card_stack);
      card_stack_sprite.change_handler("click", function (event) {
        user_input.card_stack_clicked = true;
      });

      cards_sprite = engine.create_sprite(
                        [50, 50],
                        [0, 0],
                        50,
                        LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      cards_sprite.text_font = this.consts.text_font;
      cards_sprite.state = state;
      cards_sprite.set_user_render(render_cards);

      ui_field = new ui.BattleField(engine, this.consts, user_input.ui_field);
      ui_field.init();

      core = new logic.CoreClient();
      core.init();

      var reimu = new logic.Character(data.characters[0]);
      core.report_new_player(reimu, []);
      var marisa = new logic.Character(data.characters[1]);
      core.report_new_player(marisa, []);
    },

    /*
     * Game.update()
     * Update the game state based on the user input.
     */
    update: function () {
      var i, cmd;
      var self = this;

      switch (state.main) {
        case state.MainEnum.TITLE:
          if (user_input.btn_start_game_clicked) {
            this.init_game();
          }
          break;

        case state.MainEnum.GAME:
          if (user_input.card_stack_clicked) {
            state.player_cards = state.player_cards.concat(state.player_card_stack.slice(0, 2));
            state.player_card_stack = state.player_card_stack.slice(2);
          }
          break;
      }
      for (i = 0; i < watchers.length; i++) {
        var finish = watchers[i].watch(state, core);
        if (finish) {
          watchers.splice(i, 1);
          i--;
        }
      }
      user_input.reset();
      if (ui_field) {
        ui_field.update();
      }
      
      // Pull commands from core
      if (core) {
        cmd = core.pull_cmd();
        if (cmd) {
          pending_cmds.push(cmd);
        }
      }
      for (i = 0; i < pending_cmds.length; i++) {
        var success = this.handle_cmd(pending_cmds[i]);
        if (success) {
          pending_cmds.splice(i, 1);
          i--;
        }
      }
    },

    // return true if the command is handled successfully
    handle_cmd: function (cmd) {
      switch (cmd[0]) {
        case "ask_init_position":
          return handle_ask_init_position.call(this, cmd);
        case "ask_movement":
          return handle_ask_movement.call(this, cmd);
        default:
          throw new Error("handle_cmd: unknwon cmd type");
      }
    },

    /*
     * Game.run()
     * The main loop of the game
     */
    run: function () {
      var self = this;
      var canvas = document.getElementById("myCanvas");
      engine = new LkyEngine.Engine(canvas);
      this.init(engine);

      var frame = function () {
        self.update();
        engine.render();
        requestAnimationFrame(frame, canvas); // require next frame
      };
     
      frame();
    }
  };

  // return module object
  return {
    Game: Game
  };

});