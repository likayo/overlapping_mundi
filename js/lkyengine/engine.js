// engine.js

;define(["./sprite"],
function (Sprite) {
  "use strict";
  Sprite = Sprite.Sprite;

  /*
   * Engine: deal with graphic and user input
   */
  var Engine = (function () {
    /*
     * Engine(canvas): 
     * Constructor.
     * Args:
     *    canvas: the <canvas> element used to draw.
     */
    function Engine(canvas) {
      var self = this;

      /*
       * PRIVATE MEMBER
       */
      var ctx = null;           // context of the canvas
      var sprites = null;       // all sprites
      var clickables = null;    // all clickable sprites

      /*
       * PUBLIC MEMBER
       */
      this.canvas  = canvas;    // the <canvas> element

      /*
       * PRIVILEGED PUBLIC METHODS
       */
      /*
       * init
       * Initialize the engine.
       *    size: the size of the canvas
       */
      this.init = function (size) {
        this.canvas.width = size[0];
        this.canvas.height = size[1];
        ctx = this.canvas.getContext("2d");
        sprites = [];
        clickables = [];
        // Enable mouse event detection
        this.canvas.addEventListener("click", handler.onclick, false);
      };

      /*
       * create_sprite(xy, size, depth, type)
       * Create a new sprite and return.
       * Args:
       *    xy, size: the geometrical properties of the new sprite
       *    depth:
       *    type: should be a valid value from Sprite.TypeEnum
       */
      this.create_sprite = function (xy, size, depth, type) {
        var spr = new Sprite(this, xy, size, depth);
        spr.set_type(type);
        sprites.push(spr);
        return spr;
      };

      this.get_sprite = function (spr) {
        if (typeof spr === "string") {
          // TODO: add sprite name support
        } else if (spr instanceof Sprite) {
          for (var i = 0; i < sprites.length; i++) {
            if (spr === sprites[i]) {
              return sprites[i];
            }
          }
        }
      };

      this.remove_sprite = function (spr) {
        if (typeof spr === "string") {
          this.remove_sprite(this.get_sprite(spr));
        } else if (spr instanceof Sprite) {
          for (var i = 0; i < sprites.length; i++) {
            if (spr === sprites[i]) {
              sprites.splice(i, 1);
              break;
            }
          }
          for (var i = 0; i < clickables.length; i++) {
            if (spr === clickables[i].sprite) {
              clickables.splice(i, 1);
              break;
            }
          }
        }
      };

      /*
       * render
       * Redraw the canvas.
       */
      this.render = function () {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // draw sprites in descending order of their depth.
        sprites.sort(function (a, b) { return - (a.depth - b.depth); });
        for (var i = 0; i < sprites.length; i++) {
          sprites[i].render(ctx);
        }
      };

      /*
       * register_event(sprite, event_name, spec)
       * Register a sprite to handle events. Usually, a callback function is 
       * provided and should be called when such an event happens.
       * Args:
       *    sprite:
       *    event_name: can be "load", "click", etc.
       *    spec: extra specifications of registration
       */
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
                              callback: spec.callback
                            });
            break;
          default:
            throw new Error("unknown event type: " + event_name);
        }
      };

      /*
       * PRIVATE EVENT HANDLERS
       * Handle all the events. Call the approriate callback functions.
       */
      var handler = {
        onclick: function (event) {
          var in_rect = function (xy, rect) {
            var x = xy[0], y = xy[1];
            return (rect[0] <= x && x <= rect[0] + rect[2] && 
                    rect[1] <= y && y <= rect[1] + rect[3]);
          };
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
        }
        // ,onload: function (event, img) {
        //   console.log(event);
        //   console.log(img.src);
        //   ctx.drawImage(img,  0,
        //                       0,
        //                       670,
        //                       432);
        // }
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