(function () {
  InkDeck.viewportWidth = function () {
    var page = document.querySelector('.page.active');
    return Math.min(window.innerWidth, page ? page.clientWidth : window.innerWidth);
  };
  InkDeck.viewportBottom = function () { return window.innerHeight - 8; };
  InkDeck.wordleCellSize = function () {
    var page=document.getElementById('wordle'),landscape=window.innerWidth>window.innerHeight*1.35;
    var h=page.clientHeight||window.innerHeight-50,w=page.clientWidth||window.innerWidth;
    return Math.max(18,Math.floor(Math.min(70,(landscape?w*.44-16:w-24)/5,(h-(landscape?66:300))/6)));
  };
}());
