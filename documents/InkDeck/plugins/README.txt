PLUGINY INKDECK 3.0

Plugin jest podfolderem w documents/InkDeck/plugins zawierającym plugin.js.
Po dodaniu pluginu uruchom ponownie aktualizator bieżącej wersji InkDeck, aby został wczytany.

Pluginy mogą:
- dodawać pełne gry i narzędzia przez InkDeck.register(...);
- reagować na zdarzenia przez InkDeck.on(nazwa, funkcja);
- odczytać pozycję szachową przez InkDeck.getChessState();
- ustawić standardową figurę przez InkDeck.setChessPiece(pole, figura);
- rejestrować opis własnej figury przez InkDeck.registerChessPiece(id, definicja);
- dodać przycisk nad szachownicą przez InkDeck.addChessAction(etykieta, funkcja).

Przykład dodatkowego przycisku:

(function () {
  InkDeck.addChessAction('ODWRÓĆ', function () {
    var state = InkDeck.getChessState();
    alert('Ostatni ruch: ' + state.lastMove.from + ' -> ' + state.lastMove.to);
  });
}());

Plugin działa z uprawnieniami InkDeck. Instaluj wyłącznie kod z zaufanego źródła.
