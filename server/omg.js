/*
 * omg.js
 * Overlapping Mundi Game (OMG) Langrange definition
 */
"use strict";

var db = require("./db_");

// builtin variable
// @user: the user of the card
// @n_round: round number
// @n_handcard: round number
// @this_card: the relevant card
// @attack_card: current attack card

var cards = {};
var buffs = {};

var o = {
  // Default behavior
  DEFAULT: null,

  // Card Timing
  CT_IN_ANY_TURN: 0x000,
  CT_IN_MY_TURN: 0x100,
  CT_NOT_IN_MY_TURN: 0x200,
  CT_IN_ENEMY_TURN: 0x300,

  CT_ALWAYS: 0,
  CT_IN_PHASE_A: 1,
  CT_IN_PHASE_B: 2,
  CT_IN_PHASE_C: 3,

  CT_USE_ATTACK_CARD: 10,
  CT_ATTACK_HIT: 11,

  // // Buff lifespan
  // LIFESPAN_ALWAYS: 0,
  // LIFESPAN_ONETIME: 1,

  DefineCard: function (type, id, name, descriptor) {
    if (this.GetCardById(id) !== undefined) {
      throw "Duplicate card defined.";
    }
    var card_data = db.cards.by_id(id);
    if (card_data === undefined) {
      throw "Card ID not found.";
    }
    if (card_data.name !== name) {
      throw "Card name mismatch.";
    }
    if (card_data.main_type !== type) {
      throw "Card type mismatch.";
    }
    // TODO: check descriptor validity
    cards[id] = {
      type: type,
      name: name,
      descriptor: descriptor
    };
    console.log(JSON.stringify(cards[id]));
  },

  DefineBuff: function (name, descriptor) {
    if (this.GetBuffByName(name) !== undefined) {
      throw "Duplicate buff defined.";
    }
    buffs[name] = {
      descriptor: descriptor
    };
  },

  GetCardById: function (id) {
    if (id in cards) {
      return cards[id];
    } else {
      return undefined;
    }
  },

  GetBuffByName: function (name) {
    if (name in buffs) {
      return buffs[name];
    } else {
      return undefined;
    }
  }
};

var trivial_exprs = [
  "Add", "Equals", "GreaterThan",
  "AddBuff", "RemoveBuff", "RemoveThisBuff", "AddHp", "AddAtk",
  "MoveCardToTransit", "MoveCardToDarkLand", "AskDiscardHandCard"];

for (var i in trivial_exprs) {
  o[trivial_exprs[i]] = function (fname) {
    return function () {
      return ([fname]).concat(Array.from(arguments));
    };
  }(trivial_exprs[i]);
}

// Load logic effect
var logic_effect = require("./logic_effect")(o);
module.exports = o;
