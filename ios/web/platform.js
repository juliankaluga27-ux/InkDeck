(function () {
  InkDeck.viewportWidth = function () {
    var page = document.querySelector('.page.active');
    return Math.min(window.innerWidth, page ? page.clientWidth : window.innerWidth);
  };
  InkDeck.viewportBottom = function () { return window.innerHeight - 8; };
}());
