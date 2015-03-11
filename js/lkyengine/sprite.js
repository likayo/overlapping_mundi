// sprite.js

;define(function () {
  "use strict";
  /*
   * Sprite
   * 
   */
  var Sprite = (function () {
     /*
      * Sprite(engine, xy, size, depth): 
      * Create an empty sprite.
      * Args:
      *   engine: the engine that this sprite is binded to.
      *   xy: the coordinate of the topleft of sprite.
      *   size: 
      *   depth: 0 means the sprite would be shown at the frontest.
      */
    function Sprite(engine_, xy, size_, depth_) {
      var self = this;

      /*
       *  PRIVATE MEMBERS
       */
      var engine = engine_;
      var type = Sprite.TypeEnum.EMPTY;
      var src = null;
      var img = null;
      var user_render = null;  // user-defined render function
      var handler = { // definitions are put below
                      onload: null,
                      onclick: null,
                      onmousedown: null
                    };

      /*
       *  PUBLIC MEMBERS
       */
      this.topleft = xy;
      this.size = size_;
      this.depth = depth_;
      this.invisible = false;
      this.user_handler = {
                            onload: null,
                            onclick: null,
                            onmousedown: null
                          };                   

      /*
       *  PRIVILEGED PUBLIC METHODS
       */
      this.get_type = function () { return type; };
      this.get_src = function () { return src; };
      this.img_loaded = function () { return img !== null; };

      this.set_type = function (type_) {
        switch (type_) {
          case Sprite.TypeEnum.EMPTY:
            src = img = null;
            break;
          case Sprite.TypeEnum.STATIC_IMG:
            src = img = null;
            break;
          case Sprite.TypeEnum.USER_CUSTIOMIZED:
            user_render = null;
            break;
          default:
            throw new Error("unknwon sprite type");
        }
        type = type_;
      };

      this.set_user_render = function (impl) { user_render = impl; };

      // TODO: change some public properties into private and add these methods:
      // move_to, resize, redepth
      // because these properties will affect the clickable area and priority.

      this.change_img = function (src_) {
        switch (type) {
          case Sprite.TypeEnum.STATIC_IMG:
            src = src_;
            img = null;
            engine.register_event(this, "load",
                                  {
                                    type: "img",
                                    src: src_,
                                    callback: handler.onload
                                  });
            break;
          default:
            throw new Error("change_img: illegal sprite type");
        }
      };

      this.change_handler = function (event_name, handler_) {
        switch (event_name) {
          case "load":
            if (handler_) {
              this.user_handler.onload = handler_;
            } else {
              this.user_handler.onload = null;
            }
            break;
          case "click":
            if (handler_) {
              this.user_handler.onclick = handler_;
              engine.register_event(this, "click", { callback: handler.onclick });
            } else {
              throw new Error("change_handler: unregistering handler is unimplemented yet");
            }
            break;
          default:
            throw new Error("unknown event type: " + event_name);
        }
      };

      this.render = function(ctx) {
        if (this.invisible) {
          return;
        }
        switch (type) {
          case Sprite.TypeEnum.STATIC_IMG:
            if (this.img_loaded()) {
              ctx.drawImage(img,  this.topleft[0],
                                  this.topleft[1],
                                  this.size[0],
                                  this.size[1]);
            }
            break;
          case Sprite.TypeEnum.USER_CUSTIOMIZED:
            if (user_render !== null) {
              user_render.call(this, ctx);
            }
          case Sprite.TypeEnum.EMPTY:
            break;
          default:
            throw new Error("illegal sprite type");
        }
      };

      /*
       *  PRIVATE METHODS
       */
      handler.onload = function (event_, img_) {
        img = img_;
        if (self.user_handler.onload) {
          self.user_handler.onload.call(self, event_, img_);
        }
      };

      handler.onclick = function (event_) {
        if (self.user_handler.onclick) {
          self.user_handler.onclick.call(self, event_);
        }
      };

    };  // End Sprite constructor
    Sprite.TypeEnum = Object.freeze({
                                      EMPTY: 0,
                                      STATIC_IMG: 1,
                                      USER_CUSTIOMIZED: 100
                                    });
    return Sprite;

  })();

  // Module content
  return {
    Sprite: Sprite
  };

});
