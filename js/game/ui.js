/*
 * ui.js
 * UI elements: BattleField
 */
;define(["lkyengine", "./utils"],
function (LkyEngine, utils) {
  "use strict";
  var create_2d_array = utils.create_2d_array;
  var clone_array = utils.clone_array;
  utils = undefined;

  var Watcher = function Watcher (ui_element, collector, callback) {
    this.ui_element = ui_element;
    this.collector  = collector;
    this.watch = function () {
      return callback.apply(this, arguments);
    };
  };

  /*
   * BattleField(engine, config): 
   * Args:
   *   engine:
   *   config: graphic configurations
   */
  var BattleField = function BattleField (engine_, config_) {
    /*
     *  PRIVATE MEMBERS
     */
    var engine = engine_;
    var config = config_;
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
                    config.layout.map.slice(0, 2),
                    config.layout.map.slice(2, 4),
                    LkyEngine.Engine.MaxDepth,
                    LkyEngine.Sprite.TypeEnum.STATIC_IMG);
      spr_board.change_img("img/board.jpg");

      // Create mark sprites
      sprs_mark = create_2d_array(config.battle_field_size);
      for (i = 0; i < config.battle_field_size[0]; i++) {
        for (j = 0; j < config.battle_field_size[1]; j++) {
          var tmp = [config.layout.map[0] + j * config.layout.map_grid_size[0] + 14,
                    config.layout.map[1] + i * config.layout.map_grid_size[1] + 14];
          spr = engine.create_sprite(tmp,
                                    config.layout.map_grid_size,
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

      spr_btn_cancel = engine.create_sprite([config.layout.map[0] + config.layout.map[2] + 20,
                          config.layout.map[1]],
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

    /*
     * Calculate the absolute position of a given character
     */
    var _character_xy = function (ch) {
      return [spr_board.topleft[0] + ch.pos[1] * config.layout.map_grid_size[0] + 14,
              spr_board.topleft[1] + (ch.pos[0] - 0.3) * config.layout.map_grid_size[1] + 14];
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
                  _character_xy(ch),
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
      for (var i = 0 ; i < config.battle_field_size[0]; i++) {
        for (var j = 0 ; j < config.battle_field_size[1]; j++) {
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
      var empty_mat = create_2d_array(config.battle_field_size, false);
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
        sprs_character[i].topleft = _character_xy(characters[i]);
      }
      input_collector.reset();
    };
  };  // End BattleField constructor
  BattleField.CANCELABLE = true;

  /*
   * CardSelection(engine, config): 
   * Args:
   *   engine:
   *   config: graphic configurations
   */
  var CardSelection = function CardSelection (engine_, config_) {
    /*
     *  PRIVATE MEMBERS
     */
    var engine = engine_;
    var config = config_;
    var input_collector = null;
    var cards = null;
    var selected = null;
    // sprites
    var sprs_card = null;

    /*
     *  PUBLIC MEMBERS
     */
    this.sel_type = CardSelection.SelTypeEnum.NO_PICK;

    /*
     * CardSelection.init()
     */
    this.init = function () {
      var i, j;
      var tmp;
      var spr;

      input_collector = {
        reset: function () {
          this.clicked = -1;
        }
      };
      input_collector.reset();

      this.clear_cards();
    };  // End CardSelection.init()

    /*
     * CardSelection.create_watcher(callback)
     * Create a watcher on this CardSelection.
     */
    this.create_watcher = function (callback) {
      return new Watcher(this, input_collector, callback);
    };

    /*
     *  RENDERING FUNCTION
     */
    var render_card = function (ctx) {
      // this: card_sprite
      var i,
          topleft = this.topleft,
          card_size = this.size;

      ctx.beginPath();
      if (this.mouseon) {
        ctx.strokeStyle = "red";
      } else if (this.selected) {
        ctx.strokeStyle = "crimson";
      } else {
        ctx.strokeStyle = "black";
      }
      ctx.lineWidth   = 5;
      ctx.font        = this.text_font;
      ctx.textAlign   = "center";

      ctx.fillStyle   = "white";
      ctx.rect(topleft[0], topleft[1], card_size[0], card_size[1]);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle   = "black";
      ctx.fillText(this.card.name,
                  topleft[0] + card_size[0] / 2,
                  topleft[1] + card_size[1] / 2);
    };

    // private
    var _create_card_sprites = function () {
      // this: CardSelection object
      if (Array.isArray(sprs_card) && sprs_card.length > 0) {
        // TODO: remove existing cards
      }
      sprs_card = [];
      var interval = 20;
      if (cards.length >= 2) {
        var hblank = config.rect[2] - cards.length * config.card_size[0];
        interval = Math.min(interval, hblank / (cards.length - 1));
      }
      for (var i = 0; i < cards.length; i++) {
        var topleft = [ config.rect[0] + i * (config.card_size[0] + interval),
                        config.rect[1]];
        var spr = engine.create_sprite(topleft,
                                  config.card_size,
                                  25,
                                  LkyEngine.Sprite.TypeEnum.USER_CUSTIOMIZED);
        spr.set_user_render(render_card);
        spr.change_handler("mousemove", function (event, mouse_xy) {
          this.mouseon = true;
        });
        spr.change_handler("mouseout", function (event, mouse_xy) {
          this.mouseon = false;
        });
        spr.change_handler("click", function (event, mouse_xy) {
          if (this.selected) {
            this.topleft[1] += 10;
            this.selected = false;
          } else {
            this.topleft[1] -= 10;
            this.selected = true;
          }
        });
        spr.card = cards[i];
        spr.mouseon = false;
        spr.selected = false;
        spr.index = i;
        sprs_card.push(spr);
      }
    };

    this.display_cards = function (cards_) {
      cards = clone_array(cards_);
      selected = null;
      this.sel_type = CardSelection.SelTypeEnum.NO_PICK;
      _create_card_sprites.call(this);
    };

    this.pick_one_card = function (cards_) {
      cards = clone_array(cards_);
      selected = cards.map(x => false);
      this.sel_type = CardSelection.SelTypeEnum.PICK_ONE;
      _create_card_sprites.call(this);
    };

    this.pick_multiple_cards = function (cards_) {
      cards = clone_array(cards_);
      selected = cards.map(x => false);
      this.sel_type = CardSelection.SelTypeEnum.PICK_MULTIPLE;
      _create_card_sprites.call(this);
    };

    this.clear_cards = function () {
      return this.display_cards([]);
    }

    /*
     * CardSelection.update()
     * update the state of CardSelection and reset user input collector.
     */
    this.update = function () {
      
      input_collector.reset();
    };
  };  // End CardSelection constructor
  CardSelection.SelTypeEnum = Object.freeze({
                                              NO_PICK: 0,
                                              PICK_ONE: 1,
                                              PICK_MULTIPLE: 2
                                            });

  // return module object
  return {
    BattleField: BattleField,
    CardSelection: CardSelection
  };
  
});
