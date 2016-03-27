/*
 * game.js
 * Game main loop.
 */

;define(["lkyengine", "./logic", "./ui", "./db", "./utils"],
function (LkyEngine, logic, ui, db, utils) {
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
      card_stack_sprite = null;
  // UI elements
  var ui_battlefield = null,
      ui_card_sel = null;
  // Core logic
  var core_server = null;
  var core_clients = null;
  // Watchers of user input
  var watchers = null;
  // Commands from core logic that is pending
  var pending_ui_cmds = null;
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
          break;
        case this.MainEnum.GAME:
          this.main               = this.MainEnum.GAME;
          this.cur_core_client_idx = 0;
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
      this.btn_start_game_clicked = false;
      this.card_stack_clicked = false;
    }
  };

  /*
   *  PRIVATE RENDERING FUNCTION
   */
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
   *  PRIVATE UI COMMAND HANDLER FUNCTION
   */
  var handle_ask_init_position = function (cmd) {
    // this: Game object
    var i, j, mat;
    var watcher;
    var player_id = cmd[1].player_id;

    var watcher_callback = function (game_state, core_client) {
      // this: Watcher object
      if (this.collector.grid_clicked) {
        core_client.report_init_position(this.player_id, this.collector.grid_clicked);
        this.ui_element.add_character(core_client.get_player(this.player_id).main_character);
        this.ui_element.disable_pos_selection();
        game_state.cur_core_client_idx = 1 - game_state.cur_core_client_idx;
        return true;  // finish this watcher
      }
      return false;
    };

    if (ui_battlefield.pos_selection_enabled) {   // UI elements occupied
      return false;
    }
    mat = create_2d_array(this.consts.battle_field_size, false);
    for (i = 0; i < 6; i++) {
      for (j = 0; j < 6; j++) {
        mat[(i < 3? i: i + 5)][(j < 3? j: j + 5)] = true;
      }
    }
    ui_battlefield.enable_pos_selection(mat);
    watcher = ui_battlefield.create_watcher(watcher_callback);
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

    var watcher_callback = function (game_state, core_client) {
      // this: Watcher object
      if (this.collector.grid_clicked) {
        core_client.report_movement(this.player_id, this.collector.grid_clicked);
        this.ui_element.disable_pos_selection();
        game_state.cur_core_client_idx = 1 - game_state.cur_core_client_idx;
        return true;  // finish this watcher
      } else if (this.collector.canceled) { // movement cancelled
        core_client.report_movement(this.player_id, null);
        this.ui_element.disable_pos_selection();
        game_state.cur_core_client_idx = 1 - game_state.cur_core_client_idx;
        return true;  // finish this watcher
      }
      return false;
    };

    if (ui_battlefield.pos_selection_enabled) {   // UI elements occupied
      return false;
    }
    // Search available movements
    ch = core_clients[state.cur_core_client_idx].get_player(player_id).main_character;
    dfs.result = create_2d_array(this.consts.battle_field_size, Number.POSITIVE_INFINITY);
    dfs(core_clients[state.cur_core_client_idx].generate_board_matrix(), ch.pos, 0);
    for (i = 0; i < this.consts.battle_field_size[0]; i++) {
      for (j = 0; j < this.consts.battle_field_size[1]; j++) {
        if (1 <= dfs.result[i][j] && dfs.result[i][j] <= ch.mov) {
          dfs.result[i][j] = true;
        } else {
          dfs.result[i][j] = false;
        }
      }
    }
    ui_battlefield.enable_pos_selection(dfs.result, ui.BattleField.CANCELABLE);
    watcher = ui_battlefield.create_watcher(watcher_callback);
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
        //                tl_x, tl_y, width, height
        canvas_size:      [           800, 900],
        btn_start_game:   [ 300, 200, 100, 100],
        card_stack:       [  30, 750,  80, 100],
        map:              [  20,  20, 700, 700],
        map_grid_size:    [           Math.ceil(671 / 11), Math.floor(671 / 11)],
        card_size:        [            60,  80],
        card_selection:   [ 140, 750, 600,  80]
      }
    },

    /*
     * Game.init()
     * Reset the state of game, and initialize the engine and sprites.
     */
    init: function () {
      state.reset(state.MainEnum.TITLE);
      user_input.reset();
      engine.init(this.consts.layout.canvas_size);
      watchers = [];
      pending_ui_cmds = [];

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

      ui_battlefield = new ui.BattleField(engine, this.consts);
      ui_battlefield.init();
      
      ui_card_sel = new ui.CardSelection(engine, {
                                          rect: this.consts.layout.card_selection,
                                          card_size: this.consts.layout.card_size});
      ui_card_sel.init();
      ui_card_sel.display_cards([new Card("Renying"), new Card("Renying"), new Card("Renying"), new Card("Renying"), new Card("Renying"), new Card("Renying")]);

      core_server = new logic.EmulatedCoreServer();
      core_clients = [new logic.CoreClient(), new logic.CoreClient()];
      core_clients[0].init(core_server, 0);
      core_clients[1].init(core_server, 1);

      state.cur_core_client_idx = 0;
      var reimu = new logic.Character(db.characters[0]);
      core_clients[state.cur_core_client_idx].report_new_player(reimu, []);
      state.cur_core_client_idx = 1;
      var marisa = new logic.Character(db.characters[1]);
      core_clients[state.cur_core_client_idx].report_new_player(marisa, []);
      state.cur_core_client_idx = 0;
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
        var finish = watchers[i].watch(state, core_clients[state.cur_core_client_idx]);
        if (finish) {
          watchers.splice(i, 1);
          i--;
        }
      }
      user_input.reset();
      if (ui_battlefield) {
        ui_battlefield.update();
      }
      
      // Pull commands from core
      if (Array.isArray(core_clients) && core_clients[state.cur_core_client_idx]) {
        cmd = core_clients[state.cur_core_client_idx].pull_cmd();
        if (cmd) {
          pending_ui_cmds.push(cmd);
        }
      }
      for (i = 0; i < pending_ui_cmds.length; i++) {
        var success = this.handle_ui_cmd(pending_ui_cmds[i]);
        if (success) {
          pending_ui_cmds.splice(i, 1);
          i--;
        }
      }
    },

    // return true if the command is handled successfully
    handle_ui_cmd: function (cmd) {
      switch (cmd[0]) {
        case "ask_init_position":
          return handle_ask_init_position.call(this, cmd);
        case "ask_movement":
          return handle_ask_movement.call(this, cmd);
        default:
          throw new Error("handle_ui_cmd: unknwon cmd type");
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