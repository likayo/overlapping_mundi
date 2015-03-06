/*
 * Game: 
 *
 *
 */

define(["lkyengine", "./objects"],
function (LkyEngine, objects) {
  "use strict";

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
      var map_sprite = null,
          reimu_sprite = null,
          card_stack_sprite = null;

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
          console.log("map: " + JSON.stringify([x, y]));
          if (reimu_sprite && reimu_sprite.img_loaded()) {
            reimu_sprite.topleft = [this.topleft[0] + (x + 0.5) * this.grid_size - 36,
                                    this.topleft[1] + y * this.grid_size - 40];
          }
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
                              100,
                              LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      card_stack_sprite.text_font = this.consts.text_font;
      card_stack_sprite.set_user_render(
        function (ctx) {
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
        }
      );

    },

    /*
     * Game main loop
     */

    run: function () {
      var canvas = document.getElementById("myCanvas");
      var engine = new LkyEngine.Engine(canvas);
      this.init(engine);

      var frame = function () {
        engine.update();
        engine.render();
        requestAnimationFrame(frame, canvas);
      };
     
      frame();
    }
  };

  // return module object
  return {
    Game: Game
  };

});