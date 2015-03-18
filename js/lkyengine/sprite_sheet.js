// sprite_sheet.js

;define(function () {
  "use strict";
  /*
   * SpriteSheet
   */
  var SpriteSheet = (function () {

    // Constructor
    function SpriteSheet (src, obj_grid, frame_direction, num_frame, frame_size) {
      /*
       *  PUBLIC MEMBERS
       */
      this.src = src;
      this.img = null;
      this.obj_grid = obj_grid;
      this.frame_direction = frame_direction;
      this.num_frame = num_frame;
      this.frame_size = frame_size;

      var obj_size = (this.frame_direction === SpriteSheet.FrameDirectionEnum.HORIZONTAL
                      ? [this.frame_size[0] * this.num_frame, this.frame_size[1]]
                      : [this.frame_size[0], this.frame_size[1] * this.num_frame]);

      this.img_loaded = function () { return this.img !== null; };

      this.draw_frame = function (ctx, obj_id, frame_id, topleft, size) {
        var sx = obj_id[1] * obj_size[0];
        if (this.frame_direction === SpriteSheet.FrameDirectionEnum.HORIZONTAL) {
          sx += this.frame_size[0] * frame_id;
        }
        var sy = obj_id[0] * obj_size[1];
        if (this.frame_direction === SpriteSheet.FrameDirectionEnum.VERTICAL) {
          sy += this.frame_size[1] * frame_id;
        }
        ctx.drawImage(this.img,
                      sx, sy, frame_size[0], frame_size[1], 
                      topleft[0], topleft[1], size[0], size[1]);
      };

    };  // End SpriteSheet constructor
    SpriteSheet.FrameDirectionEnum = Object.freeze({
                                                      HORIZONTAL: 0,
                                                      VERTICAL: 1
                                                    });
    return SpriteSheet;

  })();

  // return module object
  return {
    SpriteSheet: SpriteSheet
  };
  
});
