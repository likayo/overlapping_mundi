/*
 * utils.js
 * Misc. utility functions
 */

;define(function () {
  "use strict";

  var create_2d_array = function (dim, init) {
    var arr = [];
    for (var i = 0; i < dim[0]; i++) {
      arr.push(new Array(dim[1]));
      for (var j = 0; j < dim[1]; j++) {
        arr[i][j] = init;
      }
    }
    return arr;
  };

  // Return a shallow copy of an array.
  var clone_array = function (arr) {
    return arr.map(x => x);
  };

  return {
    create_2d_array: create_2d_array,
    clone_array: clone_array
  };
});