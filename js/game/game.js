/*
 * Game: 
 *
 *
 */

define(["lkyengine", "./objects"],
function (LkyEngine, objects) {
  "use strict";

  var Game = {
    /*
     * Game main loop
     */
    run: function () {
      var canvas = document.getElementById("myCanvas");
      var engine = new LkyEngine.Engine(canvas);
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