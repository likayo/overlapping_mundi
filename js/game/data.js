/*
 * data.js
 * Read static JSON data.
 */

;define(["text!data/characters.json", "text!data/cards.json"],
function (data_characters, data_cards) {
  "use strict";

  return {
    characters: JSON.parse(data_characters),
    cards: JSON.parse(data_cards)
  }
});