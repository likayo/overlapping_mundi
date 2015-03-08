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

document.getElementById("changelog").innerHTML =  "<p>2015/03/07 ver 0.005</p>" +
                                                  "<p>2015/03/05 ver 0.003</p>" +
                                                  "<p>2015/02/01 ver 0.001</p>";
