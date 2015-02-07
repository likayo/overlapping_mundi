/*
 * Game: 
 *
 *
 */

define(["lkyengine", "./objects"],
function (lkyengine, objects) {
  "use strict";

  var Game = {
    /*
     * Game main loop
     */
    run: function () {
      var canvas = document.getElementById("myCanvas");
      var engine = new lkyengine.Engine(canvas);
      engine.init();

      var frame = function () {
        engine.update();
        engine.render();
        requestAnimationFrame(frame, canvas);
      };
     
      frame();
    }
  };

  return {
    Game: Game
  };

});