# Multiplayer InkDeck (PHP / MySQL)

Trzy gry: szachy, warcaby 8 × 8 w wariancie InkDeck (bicie wstecz i daleka damka) lub wariancie angielskim oraz kółko i krzyżyk. Jedna osoba tworzy pokój z kodem, druga dołącza. Nie jest wymagane konto.

Multiplayer jest częścią InkDeck 3.11.0. Serwer został wdrożony na multiplicatingkid.pl; połączenie z bazą potwierdzono testem serwera. Pełna partia na dwóch fizycznych Kindle pozostaje do potwierdzenia.

## Hosting

PHP 7.4+ (zalecany utrzymywany PHP 8.x), rozszerzenie `pdo_mysql`, MySQL/MariaDB z InnoDB, HTTPS. Żądania InkDecka są zwykłymi POST JSON; nie trzeba WebSocketów, stałego procesu ani instalacji BusyBoxa/Toyboxa.

Zawartość `public/` trafia do publicznego folderu `multiplayerinkdeck/` na domenie multiplicatingkid.pl. Preferowana lokalizacja config.php jest poza katalogiem publicznym. Jeśli konto FTP nie pozwala wyjść poza public_html, API może użyć istniejącego config.php w multiplayerinkdeck. Dołączony .htaccess blokuje jego pobieranie na Apache; plik PHP musi być wykonywany przez serwer.

Domyślna lokalizacja konfiguracji: `inkdeck-private/config.php` obok katalogu publicznego hostingu. Przykład: jeśli API ma ścieżkę `/home/account/public_html/multiplayerinkdeck/api.php`, konfiguracja musi być `/home/account/inkdeck-private/config.php`. Jeśli użytkownik zapisał ją gdzie indziej, administrator może wskazać dokładną ścieżkę zmienną środowiskową `INKDECK_CONFIG_PATH`; przed wdrożeniem trzeba ustalić tę lokalizację.

`config.template.php` pokazuje oczekiwaną tablicę z kluczami db_host, db_port, db_name, db_user, db_password oraz table_prefix. Login i hasło pozostają wyłącznie w prywatnym pliku na hostingu. Nie umieszczaj ich w repozytorium ani aplikacji Kindle.

Po pierwszym poprawnym połączeniu API tworzy tylko własne tabele `inkdeck_rooms` i `inkdeck_rates` przez `CREATE TABLE IF NOT EXISTS`. Potrzebne są uprawnienia CREATE, SELECT, INSERT, UPDATE oraz DELETE. Nie dotyka tabel innych projektów. Prefiks musi być wolny przed instalacją. Mechanizm nie obsługuje migracji istniejących tabel o tej samej nazwie.

## Zachowanie

Pokój czeka godzinę na drugiego gracza, a po dołączeniu trwa do 24 godzin. Po opuszczeniu pokoju trwająca partia kończy się poddaniem. Rewanż i remis wymagają zgody obu osób. Strony pozostają takie same w rewanżu. Po utracie internetu klient ponawia odczyt stanu, zachowując kod i token gracza w localStorage. Wygaśnięcie pokoju usuwa sesję online.

Serwer sprawdza legalność każdego ruchu, kolejność tur, wymuszone dalsze bicie w warcabach i wersję planszy. Równoczesne dołączenia oraz ruchy są serializowane przez transakcje InnoDB i blokadę wiersza. Nie przyjmuje planszy ani wyniku wyliczonego przez klienta. HACKED jest zablokowany w partiach online.

Szachy obejmują szach, mat, pat, roszadę, bicie w przelocie i promocję. UI wybiera automatycznie hetmana; API dopuszcza także inne figury. Automatyczny remis przy powtarzaniu pozycji i regule 50 ruchów nie jest jeszcze zaimplementowany; gracze mogą uzgodnić remis. Clock online używa czasu serwera, zaczyna się po pierwszym ruchu i uwzględnia dodawanie czasu z ustawień gospodarza.

## Testy

`php tests/rules-test.php` sprawdza ruchy oraz reguły. `node server/multiplayerinkdeck/tests/client-test.js` z głównego katalogu repozytorium sprawdza klienta i utratę sesji. `tests/api-test.py` sprawdza API z uruchomionym PHP i osobną testową bazą MySQL. Workflow Multiplayer checks uruchamia wszystkie te testy w izolowanym środowisku; nie łączy się z produkcyjną bazą użytkownika.

## Paczka do wgrania przez FTP

Rozpakuj InkDeck-multiplayer-server.zip na swoim urządzeniu i wgraj jego zawartość bezpośrednio do public_html/multiplayerinkdeck. Wgraj także .htaccess. Paczka nie zawiera config.php i nie nadpisuje istniejących danych dostępu. Po wgraniu API zostanie sprawdzone, zanim opublikujemy nowe wydanie Kindle.
