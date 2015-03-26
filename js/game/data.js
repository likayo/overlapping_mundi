// data.js

;define(["text!data/characters.json"],
function (data_characters) {
  "use strict";

  return {
    characters: JSON.parse(data_characters)
  }
});