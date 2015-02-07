;define(function () {
  "use strict";
  /*
   * Card
   *
   *
   */
  var Card = (function () {

    // Constructor
    function Card(name) {
      this.name = name;
    };

    Card.prototype.publicFun = function() {
      return privateFun.call(this, '>>');
    };

    // function privateFun(prefix) {
    //   return prefix + this._foo;
    // }

    return Card;

  })();

  return {
    Card: Card
  };
});
