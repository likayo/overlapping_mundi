/*
 * Game: 
 *
 *
 */

define(["lkyengine", "./objects"],
function (LkyEngine, objects) {
  "use strict";

  /*
   *  PRIVATE MEMBERS
   */

  // Game state
  var state = {
    // Will be reset at the start of game
    reset: function () {
      var Card = objects.Card;
      this.reimu_xy           = [0, 0];
      this.player_cards       = [];
      this.player_card_stack  = [new Card("A"), new Card("B"), new Card("C"),
                                 new Card("AA"), new Card("BB"), new Card("CC")];
    }
  };

  // User input in a frame
  var user_input = {
    // Will be reset at the start of each frame
    reset: function () {
      this.board_clicked      = null;
      this.card_stack_pressed = false;
    }
  };

  // Sprites
  var map_sprite = null,
      reimu_sprite = null,
      card_stack_sprite = null,
      cards_sprite = null;

  /*
   *  PRIVATE RENDERING FUNCTION
   */

  var render_cards = function (ctx) {
    // this: cards_sprite
    var i,
        topleft,
        card_size = [60, 80],
        interval = 20;

    ctx.strokeStyle = "red";
    ctx.lineWidth   = 5;
    ctx.font        = this.text_font;
    for (i in this.state.player_cards) {
      topleft = [this.topleft[0] + i * card_size[0] + i * interval,
                 this.topleft[1]];
      ctx.fillStyle   = "white";
      ctx.fillRect(topleft[0], topleft[1],
                   card_size[0], card_size[1]);
      ctx.strokeRect(topleft[0], topleft[1],
                     card_size[0], card_size[1]);
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

    ctx.strokeStyle = "red";
    ctx.lineWidth   = 2;
    ctx.fillStyle   = "white";
    ctx.font        = text_font;
    for (i = n - 1; i >= 0; i--) {
      topleft = [this.topleft[0] + i * interval,
                 this.topleft[1] + i * interval];
      ctx.strokeRect(topleft[0], topleft[1],
                     card_size[0], card_size[1]);
      ctx.fillRect(topleft[0] + 1,
                   topleft[1] + 1,
                   card_size[0] - 2,
                   card_size[1] - 2);
    }
    ctx.fillStyle = "black";
    ctx.fillText("Draw",
                 this.topleft[0] + card_size[0] / 5,
                 this.topleft[1] + card_size[1] / 2);
  };

  var Game = {

    // Graphic constants
    consts: {
      text_font: "12pt 微软雅黑",
      layout: {
        canvas: [700, 500],
        //          tl_x, tl_y, width, height
        card_stack: [ 400, 200,  80, 100],
        map:        [  20,  40, 670, 432]
      }
    },

    init: function (engine) {
      state.reset();
      user_input.reset();

      engine.init(this.consts.layout.canvas);
      map_sprite = engine.create_sprite(
                      this.consts.layout.map.slice(0, 2),
                      this.consts.layout.map.slice(2, 4),
                      LkyEngine.Engine.MaxDepth,
                      LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      map_sprite.change_img("img/map.jpg");
      map_sprite.change_handler("load", function (event, img) {
        this.grid_size = Math.ceil(img.naturalWidth / 28);
        this.change_handler("click", function (event) {
          // TODO: find an uniform way to get mouse position in different browsers.
          var x = Math.floor((event.offsetX - this.topleft[0]) / this.grid_size),
              y = Math.floor((event.offsetY - this.topleft[1]) / this.grid_size);
          user_input.board_clicked = [x, y];
        });
      })

      reimu_sprite = engine.create_sprite(
                        [0, 0],
                        [64, 64],
                        100,
                        LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      reimu_sprite.change_img("img/reimu.gif");

      card_stack_sprite = engine.create_sprite(
                              this.consts.layout.card_stack.slice(0, 2),
                              this.consts.layout.card_stack.slice(2, 4),
                              50,
                              LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      card_stack_sprite.text_font = this.consts.text_font;
      card_stack_sprite.set_user_render(render_card_stack);
      card_stack_sprite.change_handler("click", function (event) {
        user_input.card_stack_pressed = true;
      });

      cards_sprite = engine.create_sprite(
                        [50, 50],
                        [0, 0],
                        50,
                        LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      cards_sprite.text_font = this.consts.text_font;
      cards_sprite.state = state;
      cards_sprite.set_user_render(render_cards);
    },

    update: function () {
      if (user_input.card_stack_pressed) {
        state.player_cards = state.player_cards.concat(state.player_card_stack.slice(0, 2));
        state.player_card_stack = state.player_card_stack.slice(2);
      }
      if (user_input.board_clicked !== null) {
        state.reimu_xy = user_input.board_clicked;
        var x = state.reimu_xy[0];
        var y = state.reimu_xy[1];
        if (reimu_sprite && reimu_sprite.img_loaded()) {
          reimu_sprite.topleft = [map_sprite.topleft[0] + (x + 0.5) * map_sprite.grid_size - 36,
                                  map_sprite.topleft[1] + y * map_sprite.grid_size - 40];
        }
      }
      user_input.reset();
    },

    /*
     * Game main loop
     */

    run: function () {
      var self = this;
      var canvas = document.getElementById("myCanvas");
      var engine = new LkyEngine.Engine(canvas);
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