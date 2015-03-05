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
        canvas: [700, 450],
        //          tl_x, tl_y, width, height
        card_stack: [400, 200, 80,  100],
        map:        [0,   0,   670, 432]
      }
    },

    init: function (engine) {
      engine.init(this.consts.layout.canvas);

      var map_sprite = engine.create_sprite(
                          this.consts.layout.map.slice(0, 2),
                          this.consts.layout.map.slice(2, 4),
                          10000,
                          LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      map_sprite.change_img("img/map.jpg");

      var card_stack_sprite = engine.create_sprite(
                          this.consts.layout.card_stack.slice(0, 2),
                          this.consts.layout.card_stack.slice(2, 4),
                          100,
                          LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
      card_stack_sprite.text_font = this.consts.text_font;
      card_stack_sprite.set_user_render(function (ctx) {
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
      });

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