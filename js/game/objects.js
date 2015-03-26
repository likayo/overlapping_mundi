;define(function () {
  "use strict";
  /*
   * Card
   *
   *
   */
  var Card = (function () {

    // Constructor
    function Card (name) {
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

  var Character = (function () {
      /*
       * Character
       * 
       */
    function Character (const_data) {
        // Constants
        this.id = const_data.id;
        this.name = const_data.name;
        this.init_hp = const_data.init_hp;
        this.max_hp = const_data.max_hp;
        this.mov = const_data.mov;
        this.inherent_skills = const_data.inherent_skills;

        // Volatile properties
        this.pos = null;
        this.hp = null;
        this.sp = null;

        // initialize character status
        this.init = function (pos) {
          this.pos = pos;
          this.hp = this.init_hp;
          this.sp = 0;
        };
    }  // End Character constructor
    return Character;

  })();

  // return module object
  return {
    Card: Card,
    Character: Character
  };
  
});
