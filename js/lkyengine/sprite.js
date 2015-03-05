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
      *   create an empty sprite.
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
          default:
            throw new Error("unknwon sprite type");
        }
        type = type_;
      };
      // TODO: change some public properties into private and add these methods:
      // move_to, resize, redepth

      this.change_img = function (src_) {
        switch (type) {
          case Sprite.TypeEnum.STATIC_IMG:
            src = src_;
            img = null;
            // TODO add loading handler
            engine.register_event(this, "load",
                                  {
                                    type: "img",
                                    src: src_,
                                    handler: function (event_, img_) {
                                      // this <- set to this sprite
                                      img = img_;
                                    }
                                  });
            break;
          default:
            throw new Error("illegal sprite type");
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
          // TODO: add user customized render type
          case Sprite.TypeEnum.EMPTY:
            break;
          default:
            throw new Error("illegal sprite type");
        }
      };

      /*
       *  PRIVATE METHODS
       */
      handler.onload = function (img_) {
        img = img_;
        if (self.user_handler.onload) {
          self.user_handler.onload.call(self, img_);
        }
      };

    };  // End Sprite constructor
    Sprite.TypeEnum = Object.freeze({
                                      EMPTY: 0,
                                      STATIC_IMG: 1
                                    });
    return Sprite;
  })();

  // Module content
  return {
    Sprite: Sprite
  };
});
