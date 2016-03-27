// TODO: this file has a duplicate in client side.

var data_characters = require("./data/characters");
var data_cards = require("./data/cards");

// db object
var db = {};
db.characters = data_characters;
db.cards = data_cards;
// Return undefined if not found
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

module.exports = db;
