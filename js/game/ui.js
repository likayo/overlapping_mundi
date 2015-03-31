// ui.js
;define(["lkyengine"],
function (LkyEngine) {
  "use strict";

  var BattleField = (function () {
     /*
      * BattleField(engine, consts, input_collector): 
      * Args:
      *   engine:
      *   consts: graphic constants
      *   input_collector: an object that collect the user input from this UI element.
      */
    function BattleField(engine_, consts_, input_collector_) {
      /*
       *  PRIVATE MEMBERS
       */
      var engine = engine_;
      var consts = consts_;
      var input_collector = input_collector_;
      var spr_board = null;
      var sprs_mark = null;
      var characters = null;
      var sprs_character = null;

      this.init = function () {
        var i, j;
        var tmp;
        var spr;

        spr_board = engine.create_sprite(
                      consts.layout.map.slice(0, 2),
                      consts.layout.map.slice(2, 4),
                      LkyEngine.Engine.MaxDepth,
                      LkyEngine.Sprite.TypeEnum.STATIC_IMG);
        spr_board.change_img("img/board.jpg");

        sprs_mark = [];
        for (i = 0; i < 11; i++) {
          sprs_mark.push([]);
          for (j = 0; j < 11; j++) {
            var tmp = [consts.layout.map[0] + j * consts.layout.map_grid_size[0] + 14,
                      consts.layout.map[1] + i * consts.layout.map_grid_size[1] + 14];
            spr = engine.create_sprite(tmp,
                                      consts.layout.map_grid_size,
                                      25,
                                      LkyEngine.Sprite.TypeEnum.SPRITE_SHEET);
            spr.change_img("img/sprite_sheet_mark.png",
                            [1, 1],
                            "horizontal",
                            100,
                            [32, 32]);
            spr.index = [i, j];
            spr.change_handler("load", function (event, img) {
              this.sheet_obj_id = [0, 0];
              this.sheet_frame_id = 0;
              this.change_handler("mousemove", function (event, mouse_xy) {
                this.sheet_frame_id = 1;
              });
              this.change_handler("mouseout", function (event, mouse_xy) {
                this.sheet_frame_id = 0;
              });
              this.change_handler("click", function (event, mouse_xy) {
                input_collector.grid_clicked = this.index;
                // console.log(this.index);
              })
            });
            spr.invisible = true;
            sprs_mark[sprs_mark.length - 1].push(spr);
          }
        }

        characters = [];
        sprs_character = [];
      };  // End BattleField.init()

      var character_xy = function (ch) {
        return [spr_board.topleft[0] + ch.pos[1] * consts.layout.map_grid_size[0] + 14,
                spr_board.topleft[1] + (ch.pos[0] - 0.3) * consts.layout.map_grid_size[1] + 14];
      };

      this.add_character = function (ch) {
        characters.push(ch);
        var x = ch.pos[0], y = ch.pos[1];
        var spr = engine.create_sprite(
                    character_xy(ch),
                    [64, 64],
                    2,
                    LkyEngine.Sprite.TypeEnum.STATIC_IMG);
        if (ch.id === 1) {
          spr.change_img("img/reimu.gif");
        } else {
          spr.change_img("img/marisa.gif");
        }
        sprs_character.push(spr);
      };

      var manhattan = function (xy1, xy2) {
        return Math.abs(xy1[0] - xy2[0]) + Math.abs(xy1[1] - xy2[1]);
      };

      this.show_possible_moves = function (ch) {
        var idx = characters.indexOf(ch);
        if (idx < 0) {
          throw new Error("show_possible_moves: character not found");
        }
        for (var i = 0; i < 11; i++) {
          for (var j = 0; j < 11; j++) {
            if (manhattan(ch.pos, [i, j]) <= ch.mov) {
              sprs_mark[i][j].invisible = false;
            } else {
              sprs_mark[i][j].invisible = true;
            }
          }
        }
      };

      this.update = function () {
        for (var i = 0; i < characters.length; i++) {
          sprs_character[i].topleft = character_xy(characters[i]);
        }
      };
    }  // End BattleField constructor
    return BattleField;

  })();

  // return module object
  return {
    BattleField: BattleField
  };
  
});
