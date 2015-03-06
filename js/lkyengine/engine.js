// engine.js

;define(["game/objects", "./sprite"],
function (objects, Sprite) {
  "use strict";
  Sprite = Sprite.Sprite;

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

      var ctx = null;
      var sprites = null;

      /*
       * PUBLIC MEMBER
       */

      this.canvas  = canvas;

      /*
       * PRIVILEGED PUBLIC METHODS
       */
      this.init = function (size) {
        this.canvas.width = size[0];
        this.canvas.height = size[1];
        ctx = this.canvas.getContext("2d");
        state.reset();
        user_input.reset();
        sprites = [];

        // Enable mouse event detection
        clickables = [];
        this.canvas.addEventListener("click", handler.onclick, false);
        // clickables.push({
        //                   rect: this.consts.layout.card_stack,
        //                   callback: function (event) {user_input.card_stack_pressed = true;}
        //                 });
      };

      this.create_sprite = function (xy, size, depth, type) {
        var spr = new Sprite(this, xy, size, depth);
        spr.set_type(type);
        sprites.push(spr);
        return spr;
      }

      this.update = function () {
        change_state.call(this);
      };

      this.render = function () {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i = 0; i < sprites.length; i++) {
          sprites[i].render(ctx);
        }
        // render_cards.call(this, state.player_cards, [50, 50]);
      };

      /*
       *  PRIVATE USER INPUT PARSER
       *  parse user input and change engine state
       */

      var state = {
        reset: function () {
          var Card = objects.Card;
          this.player_cards       = [];
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
          var clicked = null;
          var min_depth = Engine.MaxDepth + 1;
          for (var i = 0; i < clickables.length; i++) {
            // TODO: find an uniform way to get mouse position in different browsers.
            if (in_rect([event.offsetX, event.offsetY], clickables[i].rect)) {
              if (min_depth > clickables[i].sprite.depth) {
                clicked = clickables[i];
                min_depth = clicked.sprite.depth;
              }
            }
          }
          if (clicked) {
            clicked.callback.call(clicked.sprite, event);
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

      this.register_event = function (sprite, event_name, spec) {
        switch (event_name) {
          case "load":
            // TODO: if necessary, this will be encapsulated by a separate
            // "load_image" method
            // spec = { type: "img", src: "...", callback: function(event, img) }
            var img = document.createElement("img");
            img.addEventListener("load",
                                  function (event) {
                                    spec.callback.apply(sprite, [event, img]);
                                  },
                                  false);
            img.src = spec.src;
            break;
          case "click":
            // spec = { callback: function (event) }
            clickables.push({
                              rect: sprite.topleft.concat(sprite.size),
                              sprite: sprite,
                              // callback: function (event) {user_input.card_stack_pressed = true;}
                              callback: spec.callback
                            });
            break;
          default:
            throw new Error("unknown event type: " + event_name);
        }
      };

      /*
       *  PRIVATE RENDERING FUNCTION
       *  TODO: move to Game
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

    };  // End Engine constructor
    Engine.MaxDepth = 10000;
    return Engine;

  })();

  // return module object
  return {
    Engine: Engine,
    Sprite: Sprite
  };

});