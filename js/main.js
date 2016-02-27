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
            ],
  paths: {
    "game_state": ["http://localhost:13140/game_state"],
    "data": ["http://localhost:13140/data"]
  },
  shim: {
    "game_state": {
      exports: "GameState"
    }
  },
  // Refer to http://jaketrent.com/post/cross-domain-requirejs-text/7
  config: {
    text: {
      useXhr: function (url, protocol, hostname, port) {
        // allow cross-domain requests
        // remote server allows CORS
        return true;
      }
    }
  }
});

require(["game", "game/cmdline_client"],
  function(game, cmdline_client) {
    game.Game.run();
    cmdline_client.CmdlineClient.run();
  }
);

document.getElementById("changelog").innerHTML =  "<p>2016/02/13 ver 0.015</p>" +
                                                  "<p>2016/02/13 ver 0.012</p>" +
                                                  "<p>2015/09/21 ver 0.011</p>" +
                                                  "<p>2015/04/07 ver 0.010</p>" +
                                                  "<p>2015/03/31 ver 0.009</p>" +
                                                  "<p>2015/03/18 ver 0.008</p>" +
                                                  "<p>2015/03/17 ver 0.007</p>" +
                                                  "<p>2015/03/07 ver 0.005</p>" +
                                                  "<p>2015/03/05 ver 0.003</p>" +
                                                  "<p>2015/02/01 ver 0.001</p>";
