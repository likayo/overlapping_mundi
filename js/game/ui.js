/*
 * ui.js
 * UI elements: BattleField
 */
;define(["lkyengine", "./utils"],
function (LkyEngine, utils) {
  "use strict";
  var create_2d_array = utils.create_2d_array;
  utils = undefined;

  var Watcher = function Watcher (ui_element, collector, callback) {
    this.ui_element = ui_element;
    this.collector  = collector;
    this.watch = function () {
      return callback.apply(this, arguments);
    };
  };

  /*
   * BattleField(engine, consts, input_collector): 
   * Args:
   *   engine:
   *   consts: graphic constants
   *   input_collector: an object that collect the user input from this UI element.
   */
  var BattleField = function BattleField (engine_, consts_) {
    /*
     *  PRIVATE MEMBERS
     */
    var engine = engine_;
    var consts = consts_;
    var input_collector = null;
    var characters = null;
    // sprites
    var spr_board = null;
    var sprs_mark = null;
    var sprs_character = null;
    var spr_btn_cancel = null;

    /*
     *  PUBLIC MEMBERS
     */
    this.pos_selection_enabled = false;

    /*
     * BattleField.init()
     */
    this.init = function () {
      var i, j;
      var tmp;
      var spr;

      input_collector = {
        reset: function () {
          this.grid_clicked = null;
          this.canceled     = false;
        }
      };
      input_collector.reset();

      spr_board = engine.create_sprite(
                    consts.layout.map.slice(0, 2),
                    consts.layout.map.slice(2, 4),
                    LkyEngine.Engine.MaxDepth,
                    LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      spr_board.change_img("img/board.jpg");

      sprs_mark = create_2d_array(consts.battle_field_size);
      for (i = 0; i < consts.battle_field_size[0]; i++) {
        for (j = 0; j < consts.battle_field_size[1]; j++) {
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
              if (!this.invisible) {  // disable the button when invisible
                input_collector.grid_clicked = this.index;
              }
            })
          });
          sprs_mark[i][j] = spr;
        }
      }

      spr_btn_cancel = engine.create_sprite([consts.layout.map[0] + consts.layout.map[2] + 20,
                          consts.layout.map[1]],
                          [48, 48],
                          25,
                          LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      spr_btn_cancel.change_img("img/cancel.png");
      spr_btn_cancel.change_handler("load", function (event, img) {
        this.change_handler("click", function (event, mouse_xy) {
          if (!this.invisible) {  // disable the button when invisible
            input_collector.canceled = true;
          }
        });
      });

      characters = [];
      sprs_character = [];
      this.disable_pos_selection();
    };  // End BattleField.init()

    var character_xy = function (ch) {
      return [spr_board.topleft[0] + ch.pos[1] * consts.layout.map_grid_size[0] + 14,
              spr_board.topleft[1] + (ch.pos[0] - 0.3) * consts.layout.map_grid_size[1] + 14];
    };

    /*
     * BattleField.add_character(ch)
     * Add a new Character on the board.
     * Create a sprite that corresponds to that character.
     */
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

    /*
     * BattleField.enable_pos_selection(candidates, cancelable)
     * Start a position selection on the board. Can be configured to be
     * cancelable.
     * Args:
     *   candidates: a 2d boolean array that lists candidate positions.
     *   cancelable: if this selection is calcenlable. Default to false.
     */
    this.enable_pos_selection = function (candidates, cancelable) {
      this.pos_selection_enabled = true;
      for (var i = 0 ; i < consts.battle_field_size[0]; i++) {
        for (var j = 0 ; j < consts.battle_field_size[1]; j++) {
          if (candidates[i][j]) {
            sprs_mark[i][j].invisible = false;
          } else {
            sprs_mark[i][j].invisible = true;
          }
        }
      }
      cancelable = !!cancelable;
      spr_btn_cancel.invisible = !cancelable;
    };

    /*
     * BattleField.disable_pos_selection()
     * End a position selection.
     */
    this.disable_pos_selection = function () {
      var empty_mat = create_2d_array(consts.battle_field_size, false);
      this.enable_pos_selection(empty_mat, !BattleField.Cancelable);
      this.pos_selection_enabled = false;
    };

    /*
     * BattleField.create_watcher(callback)
     * Create a watcher on this BattleField.
     */
    this.create_watcher = function (callback) {
      return new Watcher(this, input_collector, callback);
    };

    /*
     * BattleField.update()
     * update the state of BattleField and reset user input collector.
     */
    this.update = function () {
      for (var i = 0; i < characters.length; i++) {
        sprs_character[i].topleft = character_xy(characters[i]);
      }
      input_collector.reset();
    };
  };  // End BattleField constructor
  BattleField.Cancelable = true;

  // return module object
  return {
    BattleField: BattleField
  };
  
});
