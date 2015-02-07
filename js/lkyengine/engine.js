// engine.js

;define(["game/objects", "./sprite"],
function (objects, sprite) {
  "use strict";

  /*
   * Engine: deal with graphic and user input
   *
   *
   */
  var Engine = (function () {
    // Constructor
    function Engine(canvas) {
      var self = this;

      /*
       * PRIVATE MEMBER
       */
      var ctx = undefined;

      /*
       * PUBLIC MEMBER
       */
      // graphic consts
      this.consts = {
        text_font: "12pt 微软雅黑",
        layout: {
          canvas: [700, 450],
          //          tl_x, tl_y, width, height
          card_stack: [400, 200, 80,  100],
          map:        [0,   0,   670, 432]
        }
      };
      this.canvas  = canvas;

      /*
       * PRIVILEGED PUBLIC METHODS
       */
      this.init = function () {
        this.canvas.width = this.consts.layout.canvas[0];
        this.canvas.height = this.consts.layout.canvas[1];
        ctx = this.canvas.getContext("2d");
        state.reset();
        user_input.reset();
        clickables = [];
        this.canvas.addEventListener("click", handler.onclick, false);
        clickables.push({
                          rect: this.consts.layout.card_stack,
                          callback: function (event) {user_input.card_stack_pressed = true;}
                        });
        var img = document.createElement("img");
        // TODO: modify callback to show the img after loading
        img.addEventListener("load", function (event) {handler.onload(event, img);}, false);
        img.src = "img/map.jpg";
      };

      this.update = function () {
        change_state.call(this);
      };

      this.render = function () {
        ctx.clearRect(0, 0, this.consts.layout.canvas[0], this.consts.layout.canvas[1]);
        render_cards.call(this, state.player_cards, [50, 50]);
        render_card_stack.call(this, this.consts.layout.card_stack.slice(0, 2));
      };

      /*
       *  PRIVATE USER INPUT PARSER
       *  parse user input and change engine state
       */

      var state = {
        reset: function () {
          this.player_cards       = [];
          var Card = objects.Card;
          this.player_card_stack  = [new Card("A"), new Card("B"), new Card("C"),
                                     new Card("AA"), new Card("BB"), new Card("CC")];
        }
      };

      var user_input = {
        reset: function () {
          this.card_stack_pressed = false;
        }
      };

      var change_state = function () {
        if (user_input.card_stack_pressed) {
          state.player_cards = state.player_cards.concat(state.player_card_stack.slice(0, 2));
          state.player_card_stack = state.player_card_stack.slice(2);
        }
        user_input.reset();
      };

      /*
       *  PRIVATE EVENT HANDLER
       */

      var clickables = [];

      var handler = {
        onclick: function (event) {
          var in_rect = function (xy, rect) {
            var x = xy[0], y = xy[1];
            return (rect[0] <= x && x <= rect[0] + rect[2] && 
                    rect[1] <= y && y <= rect[1] + rect[3]);
          };
          // console.log(event);
          for (var i in clickables) {
            if (in_rect([event.x, event.y], clickables[i].rect)) {
              // console.log([event.x, event.y]);
              // console.log(clickables[i].rect);
              clickables[i].callback(event);
            }
          }
        },

        onload: function (event, img) {
          console.log(event);
          console.log(img.src);
          ctx.drawImage(img,  0,
                              0,
                              670,
                              432);
        }
      };
      /*
       *  PRIVATE RENDERING FUNCTION
       */

      var render_cards = function (cards, area_tl) {
        // console.log(cards);
        var i,
            topleft,
            card_size = [60, 80],
            interval = 20;

        ctx.strokeStyle = "red";
        ctx.lineWidth   = 5;
        ctx.font        = this.consts.text_font;
        for (i in cards) {
          topleft = [area_tl[0] + i * card_size[0] + i * interval,
                     area_tl[1]];
          ctx.strokeRect(topleft[0], topleft[1],
                         card_size[0], card_size[1]);
          ctx.fillText(cards[i].name,
                      topleft[0] + card_size[0] / 2,
                      topleft[1] + card_size[1] / 2);
        }
      };

      var render_card_stack = function (area_tl) {
        var i,
            topleft,
            card_size = [60, 80],
            interval = 3,
            n = 5;

        ctx.strokeStyle = "red";
        ctx.lineWidth   = 2;
        ctx.fillStyle   = "white";
        ctx.font        = this.consts.text_font;

        for (i = n - 1; i >= 0; i--) {
          topleft = [area_tl[0] + i * interval,
                     area_tl[1] + i * interval];
          ctx.strokeRect(topleft[0], topleft[1],
                         card_size[0], card_size[1]);
          ctx.fillRect(topleft[0] + 1,
                       topleft[1] + 1,
                       card_size[0] - 2,
                       card_size[1] - 2);
        }
        ctx.fillStyle = "black";
        ctx.fillText("Draw",
                     area_tl[0] + card_size[0] / 5,
                     area_tl[1] + card_size[1] / 2);
      };
    };  // End Engine constructor
    
    return Engine;
  })();

  return {
    Engine: Engine
  };

});