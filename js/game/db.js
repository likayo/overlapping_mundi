/*
 * db.js
 * Wrap static JSON data.
 */

;define(["text!data/characters.json", "text!data/cards.json"],
function (data_characters, data_cards) {
  "use strict";

  // db object
  var db = {
    characters: JSON.parse(data_characters),
    cards: JSON.parse(data_cards)
  };
  db.characters.by_id = function (i) {
    return this.find(x => (x.id === i));
  };
  db.characters.by_name = function (name) {
    return this.find(x => (x.name === name));
  };
  db.cards.by_id = function (i) {
    return this.find(x => (x.id === i));
  };
  db.cards.by_name = function (name) {
    return this.find(x => (x.name === name));
  };

  return db;
});
