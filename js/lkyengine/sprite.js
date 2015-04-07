// sprite.js

;define(["./sprite_sheet"],
function (sprite_sheet) {
  "use strict";
  var SpriteSheet = sprite_sheet.SpriteSheet;
  sprite_sheet = undefined;

  /*
   * Sprite
   * 
   */
  var Sprite = (function () {
     /*
      * Sprite (engine, xy, size, depth): 
      * Create an empty sprite.
      * Args:
      *   engine: the engine that this sprite is binded to.
      *   xy: the coordinate of the topleft of sprite.
      *   size: 
      *   depth: 0 means the sprite would be shown at the frontest.
      *   type: type of sprite. cannot be changed
      */
    function Sprite (engine_, xy, size_, depth_, type_) {
      var self = this;

      /*
       *  PRIVATE MEMBERS
       */
      var engine = engine_;
      var type = type_;
      var handler = { // definitions are put below
                      onload: null,
                      onclick: null,
                      onmouseover: null
                    };
      // used for STATIC_IMG
      var src = null;
      var img = null;
      // used for sprite sheet;
      var sheet = null;
      // used for BUTTON
      var btn_state = Sprite.BtnStateEnum.OFF;
      // used for USER_CUSTOMIZED
      var user_render = null;  // user-defined render function

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
                            onmouseover: null
                          };
      // used for SPRITE_SHEET
      this.sheet_obj_id = null;
      this.sheet_frame_id = null;

      /*
       *  PRIVILEGED PUBLIC METHODS
       */
      this.get_type = function () { return type; };
      this.get_src = function () { return src; };
      this.img_loaded = function () { return img !== null; };

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
          case Sprite.TypeEnum.SPRITE_SHEET:
            if (arguments.length !== 5) {
              throw new Error("Sprite.change_img: arguments nubmer too few")
            }
            var obj_grid = arguments[1];
            var frame_direction = (arguments[2] === "vertical"
                                    ? SpriteSheet.FrameDirectionEnum.VERTICAL
                                    : SpriteSheet.FrameDirectionEnum.HORIZONTAL);
            var num_frame = arguments[3];
            var frame_size = arguments[4];
            sheet = new SpriteSheet(src_, obj_grid, frame_direction, num_frame, frame_size);
            engine.register_event(this, "load",
                                  {
                                    type: "img",
                                    src: src_,
                                    callback: handler.onload
                                  });
            break;
          default:
            throw new Error("Sprite.change_img: illegal sprite type");
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
            // Fall through
          case "mousemove":
            // Fall through
          case "mouseout":
            if (handler_) {
              this.user_handler["on" + event_name] = handler_;
              engine.register_event(this, event_name, { callback: handler["on" + event_name] });
            } else {
              throw new Error("change_handler: unregistering handler is unimplemented yet");
            }
            break;
          default:
            throw new Error("change_handler: unknown event type: " + event_name);
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
          case Sprite.TypeEnum.SPRITE_SHEET:
            if (sheet.img_loaded()) {
              sheet.draw_frame(ctx,
                                this.sheet_obj_id, this.sheet_frame_id,
                                this.topleft, this.size);
            }
            break;
          case Sprite.TypeEnum.USER_CUSTIOMIZED:
            if (user_render !== null) {
              user_render.call(this, ctx);
            }
          case Sprite.TypeEnum.EMPTY:
            break;
          default:
            throw new Error("render: illegal sprite type");
        }
      };

      /*
       *  PRIVATE METHODS
       */
      handler.onload = function (event_, img_) {
        switch (type) {
          case Sprite.TypeEnum.STATIC_IMG:
            img = img_;
            break;
          case Sprite.TypeEnum.SPRITE_SHEET:
            sheet.img = img_;
            break;
        }
        if (self.user_handler.onload) {
          self.user_handler.onload.call(self, event_, img_);
        }
      };

      handler.onclick = function (event_, mouse_xy) {
        if (self.user_handler.onclick) {
          self.user_handler.onclick.call(self, event_, mouse_xy);
        }
      };

      handler.onmousemove = function (event_, mouse_xy) {
        if (self.user_handler.onmousemove) {
          self.user_handler.onmousemove.call(self, event_, mouse_xy);
        }
      };

      handler.onmouseout = function (event_, mouse_xy) {
        if (self.user_handler.onmouseout) {
          self.user_handler.onmouseout.call(self, event_, mouse_xy);
        }
      };

    };  // End Sprite constructor
    Sprite.TypeEnum = Object.freeze({
                                      EMPTY: 0,
                                      STATIC_IMG: 1,
                                      SPRITE_SHEET: 2,
                                      USER_CUSTIOMIZED: 100
                                    });
    Sprite.BtnStateEnum = Object.freeze({
                                          OFF: 0,
                                          ON: 1,
                                          MOUSEDOWN: 2
                                        });
    return Sprite;

  })();

  // Module content
  return {
    Sprite: Sprite
  };

});
