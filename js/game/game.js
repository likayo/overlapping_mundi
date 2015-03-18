/*
 * Game: 
 *
 *
 */

define(["lkyengine", "./objects"],
function (LkyEngine, objects) {
  "use strict";
  var Card = objects.Card;

  /*
   *  PRIVATE MEMBERS
   */
  var engine = null;

  // Game state
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
          this.reimu_xy           = [0, 0];
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
      this.board_clicked      = null;
      this.card_stack_clicked = false;
    }
  };

  // Sprites
  var btn_start_game_sprite = null,
      map_sprite = null,
      reimu_sprite = null,
      marisa_sprite = null,
      card_stack_sprite = null,
      cards_sprite = null,
      mark_sprite = null;

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

  var Game = {

    // Graphic constants
    consts: {
      text_font: "12pt 微软雅黑",
      layout: {
        canvas: [700, 500],
        //                tl_x, tl_y, width, height
        btn_start_game:   [ 300, 200, 100, 100],
        card_stack:       [ 400, 200,  80, 100],
        map:              [  20,  40, 670, 432],
        map_grid_size:    [Math.ceil(670 / 28), Math.floor(432 / 18)]
      }
    },

    /*
     * init
     * Reset the state of game, and initialize the engine and sprites.
     */
    init: function () {
      state.reset(state.MainEnum.TITLE);
      user_input.reset();
      engine.init(this.consts.layout.canvas);

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

    init_game: function () {
      state.reset(state.MainEnum.GAME);
      user_input.reset();

      if (btn_start_game_sprite) {
        engine.remove_sprite(btn_start_game_sprite);
      }
      map_sprite = engine.create_sprite(
                      this.consts.layout.map.slice(0, 2),
                      this.consts.layout.map.slice(2, 4),
                      LkyEngine.Engine.MaxDepth,
                      LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      map_sprite.change_img("img/map.jpg");
      map_sprite.grid_size = this.consts.layout.map_grid_size;
      map_sprite.change_handler("load", function (event, img) {
        user_input.board_clicked = [0, 0];
        this.change_handler("click", function (event, mouse_xy) {
          var x = Math.floor((mouse_xy[0] - this.topleft[0]) / this.grid_size[0]),
              y = Math.floor((mouse_xy[1] - this.topleft[1]) / this.grid_size[1]);
          user_input.board_clicked = [x, y];
        });
        this.change_handler("mousemove", function (event, mouse_xy) {
          if (marisa_sprite) {
            marisa_sprite.topleft = [mouse_xy[0], mouse_xy[1]];
          }
        });
        this.change_handler("mouseout", function (event, mouse_xy) {
          if (marisa_sprite) {
            marisa_sprite.topleft = [ this.topleft[0] + this.size[0] / 2 - 25,
                                      this.topleft[1] + this.size[1] / 2 - 25];
          }
        });
      });

      reimu_sprite = engine.create_sprite(
                        [0, 0],
                        [64, 64],
                        100,
                        LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      reimu_sprite.change_img("img/reimu.gif");

      marisa_sprite = engine.create_sprite(
                        [0, 0],
                        [50, 50],
                        0,
                        LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      marisa_sprite.change_img("img/marisa.gif");

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

      console.log(this.consts.layout.map_grid_size);
      mark_sprite = engine.create_sprite(
                        this.consts.layout.map.slice(0, 2),
                        this.consts.layout.map_grid_size,
                        25,
                        LkyEngine.Sprite.TypeEnum.SPRITE_SHEET);
      mark_sprite.change_img("img/sprite_sheet_mark.png",
                              [1, 1],
                              "horizontal",
                              2,
                              [32, 32]);
      mark_sprite.change_handler("load", function (event, img) {
        this.sheet_obj_id = [0, 0];
        this.sheet_frame_id = 0;
        this.change_handler("mousemove", function (event, mouse_xy) {
          this.sheet_frame_id = 1;
        });
        this.change_handler("mouseout", function (event, mouse_xy) {
          this.sheet_frame_id = 0;
        });
      });

    },

    /*
     * update
     * Update the game state based on the user input.
     */
    update: function () {
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
          if (user_input.board_clicked !== null) {
            state.reimu_xy = user_input.board_clicked;
            var x = state.reimu_xy[0];
            var y = state.reimu_xy[1];
            if (reimu_sprite && reimu_sprite.img_loaded()) {
              reimu_sprite.topleft = [map_sprite.topleft[0] + (x + 0.5) * map_sprite.grid_size[0] - 36,
                                      map_sprite.topleft[1] + y * map_sprite.grid_size[1] - 40];
            }
          }
          break;
      }
      user_input.reset();
    },

    /*
     * run
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