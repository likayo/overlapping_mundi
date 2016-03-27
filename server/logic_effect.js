/*
 * logic_effect.js
 * Define logical effects of card/skill.
 * Used by omg.
 */
"use strict";

var logic_effect = function (o) {

  // TODO: is it necessary to write down every default behavior in the code?
  // TODO: is it necessary to unify the attributes for all cards?

  // "使用对战卡时攻击力增加100",
  o.DefineCard("item", 3000, "御币", {
    "effect": [o.AddBuff("@user", "御币", {})], // TODO: make it default?
    "unequip_effect": [o.RemoveBuff("@user", "御币")]
  });
  o.DefineBuff("御币", {
    "var": [],
    "timing": o.CT_IN_MY_TURN | o.CT_ATTACK_HIT,
    "requirement": [],
    "effect": [o.AddAtk("@attack_card", 100)],  // TODO
    "after_effect": o.DEFAULT // keep
  });

  // 下个自己回合开始，自身hp+800
  o.DefineCard("magic", 4000, "神迹", {
    "sub_type": "normal",
    "effect": [
      o.AddBuff("@user", "神迹", {"x": o.Add("@n_round", 1)})
    ],
    "after_usage": o.DEFAULT  // move to transit
  });
  o.DefineBuff("神迹", {
    "var": ["x"],
    "timing": o.CT_IN_MY_TURN | o.CT_IN_PHASE_A,
    "requirement": [o.Equals("@n_round", "$x")],
    "effect": [o.AddHp("@user", 800)],
    "after_effect": [o.RemoveThisBuff()]  // ONETIME
  });

  // 恢复500HP，然后此卡送进失落之地
  o.DefineCard("magic", 5000, "桃子", {
    "sub_type": "instant",
    "effect": [o.AddHp("@user", 500)],
    "after_usage": [o.MoveCardToDarkLand("@this_card")]
  });

  // 丢弃手中一张手卡，使得对方给你的一次对战卡攻击无效
  // TODO
  o.DefineCard("counter", 6000, "迎击", {
    "timing": o.CT_NOT_IN_MY_TURN | o.CT_USE_ATTACK_CARD,
    "requirement": [o.GreaterThan("@n_handcard", 1)],
    "effect": [o.AskDiscardHandCard("@user", 1)],
    "after_usage": o.DEFAULT
  });

  return {
    map: function (id) {
      var effect = null;
      return effect;
    }
  };
};

module.exports = logic_effect;
