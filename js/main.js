// Overlapping Mundi
requirejs.config({
  baseUrl: "js",
  packages: [
              {
                name: "lkyengine",
                main: "engine"
              }, 
              {
                name: "game",
                main: "game"
              }
            ]
});

require(["game"], function(game) {
  game.Game.run();
});

document.getElementById("changelog").innerHTML = "2015/02/01 ver 0.001";
