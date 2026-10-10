# InkDeck

Offline games and tools for jailbroken Kindle devices. InkDeck runs locally as a Mesquite application and does not require KOReader.

Current version: **3.10.6**

## Features

- games: chess, checkers, Minesweeper, 2048, Tic-tac-toe, Memory, Lights Out, Game of Life, Snake, six-level Sudoku, Nonograms, Mahjong Connect, Ludo, Paper Soccer and Polish or English Wordle; Memory supports up to 20 pairs, Minesweeper accepts custom dimensions, and Snake wraps at screen edges;
- tools: KindleWriter, sketchpad, task list, scientific calculator and Wi-Fi file upload;
- plugin support;
- Kindle AI chat with user-provided Google Gemini, OpenAI or OpenRouter; API keys can be encrypted locally with a user-selected passphrase;
- optional chess clock for two-player games;
- configurable time increment after every move in two-player chess;
- Polish 8 × 8 checkers with backward captures and flying kings, plus classic English rules;
- a stronger chess bot that detects checkmate and avoids repeated positions;
- a Mesquite-compatible continuous drawing mode in the sketchpad;
- the hidden **Hacket** reference with Wordle pools, game rules, technical secrets and an HACKED mode for rule-based games (not Wordle);
- persistent game settings and difficulty levels stored in `extensions/InkDeck/data/settings.txt`;
- update checking and installation from GitHub.

## Installation

1. Download `InkDeck-3.10.6.zip` from the newest GitHub release.
2. Copy both folders, `documents` and `extensions`, to the USB root of the Kindle.
3. Safely disconnect the Kindle.
4. Run **InkDeck** from the library. The same single shortcut installs and opens the application.

The `documents` directory contains only the single InkDeck launcher. Application files, the updater and the Wi-Fi file server are kept under `extensions/InkDeck` so Kindle does not index their internal pages as books. Updates can normally be started from **Tools → Updates** inside InkDeck.

## Safe updates

The updater downloads release assets only from this repository, verifies their SHA-256 checksum, validates the package structure and keeps a backup until installation succeeds. If downloading or verification fails, the installed application is not replaced.

## Compatibility

Developed for a jailbroken Kindle Basic 11th generation running firmware 5.19.2.0.1 with Véra and Mesquite. Other models may require layout adjustments.

## Uninstalling

The uninstall script remains available in the source repository but is intentionally excluded from release ZIP files so Kindle does not add it to the library.

---

# InkDeck — opis po polsku

InkDeck to zestaw gier i narzędzi działających całkowicie lokalnie na Kindle po jailbreaku. Aplikacja korzysta z Véra i Mesquite; KOReader nie jest wymagany.

Aktualna wersja: **3.10.6**

## Funkcje

- szachy, warcaby, Saper, 2048, kółko i krzyżyk, Memory, Zgaś światła, Gra w życie, Snake, sześciopoziomowe Sudoku, nonogramy, Mahjong Connect, Chińczyk, Piłka oraz polskie lub angielskie Wordle; Memory obsługuje do 20 par, Saper przyjmuje własne wymiary, a Snake zawija się na krawędziach;
- KindleWriter, szkicownik, lista zadań, kalkulator naukowy i przesyłanie plików przez Wi-Fi;
- szachy dla dwóch osób z zegarem i przyrostem czasu po każdym ruchu;
- dwa warianty warcabów: **polskie 8 × 8** z biciem pionem do tyłu i latającą damką oraz **angielskie** z krótką damką;
- poprawiony bot szachowy, który rozpoznaje mata i unika bezsensownego powtarzania pozycji;
- szkicownik rysujący płynne linie na silniku Mesquite;
- ukryta sekcja **Hacket** z pełnymi pulami Wordle, zasadami gier, technicznymi smaczkami i trybem HACKED w grach z zasadami (bez Wordle);
- trwały zapis ustawień i poziomów trudności w `extensions/InkDeck/data/settings.txt`;
- bezpieczna aktualizacja bezpośrednio z GitHuba.

## Instalacja

1. Pobierz `InkDeck-3.10.6.zip` z najnowszego wydania GitHub.
2. Skopiuj foldery `documents` oraz `extensions` do głównego katalogu pamięci USB Kindle.
3. Bezpiecznie odłącz Kindle od komputera.
4. Uruchom **InkDeck** z biblioteki. Ten sam skrót instaluje i otwiera aplikację.

Aktualizacje można później instalować bez komputera z poziomu **Narzędzia → Aktualizacje**. Istniejący plik ustawień zostaje zachowany.

## Ukryta sekcja Hacket

Aby ją otworzyć, na ekranie głównym dotknij szybko **7 razy napisu INKDECK** u góry. Hacket nie jest widoczny na liście gier ani narzędzi.

## Zgodność

Projekt jest przygotowany dla Kindle Basic 11. generacji / Kids z firmware 5.19.2.0.1, Véra i Mesquite. Na innych modelach układ może wymagać dopasowania.

## Wydanie 3.10.6

Powiększono klawisze Wordle i zwiększono szerokość ich pól dotykowych. Zmieniono nazwę gry na Memory; można ustawić od 2 do 20 par. W Saperze wpisuje się własną szerokość, wysokość i liczbę min. Snake zawija się na przeciwległą krawędź planszy. W HACKED dla warcabów pojedyncze dotknięcie teleportuje pionek, a szybkie podwójne dotknięcie pola zbija przeciwników po drodze.

Dodano Kindle AI z wyborem Google Gemini lub OpenAI, modelem edytowalnym przez użytkownika i rozmową w aplikacji. Potrzebny jest własny klucz API i dostęp do Wi-Fi. Klucz nie jest zapisywany w ustawieniach: pozostaje w pamięci do zamknięcia aplikacji i jest wysyłany bezpośrednio do wybranego dostawcy po naciśnięciu „Wyślij”.

## Wydanie 3.10.4

Usunięto HACKED z Wordle: gra nie przyjmuje już tajnego siedmiokrotnego kliknięcia i nie pokazuje przycisku ani komunikatu HACKED. Powiększono klawisze Wordle i ułożono je w trzy standardowe rzędy QWERTY. W nonogramie pola przechodzą przez stany puste, wypełnione i oznaczone X; każde sprzeczne oznaczenie zgłasza błąd od razu, a wygrana wymaga rozwiązania całej kratki. Powiększono planszę Sudoku, dopasowując jej rozmiar do ekranu Kindle.

## Wydanie 3.10.3

Aktualizator potrafi teraz rozpakować paczkę kilkoma metodami: bezpośrednio przez `tar`, przez `gzip`, BusyBox albo Python. Paczka aktualizacyjna jest tworzona w zgodnym formacie USTAR. Usunięto niedziałający moduł MultiplicatingKid.pl.

Rozbudowano tryb HACKED. Siedem dotknięć tej samej figury włącza go tylko dla jej koloru. W szachach jedno dotknięcie szarego pola teleportuje figurę bez bicia, a dwa szybkie dotknięcia wykonują bicie figur przeciwnika stojących na prostej drodze. Ruch HACKED nie tworzy sztucznego szacha.

Szkicownik odróżnia teraz zdarzenia dotykowe od syntetycznych zdarzeń myszy i interpoluje linię między kolejnymi punktami. Powiększono Sudoku i Piłkę na kartce, dodano cztery nonogramy oraz nowe układy Gry w życie. Nazwa Snake pozostaje taka sama również w polskiej wersji.

## Wydanie 3.10.2

Usunięto błąd „Application Error” występujący przy przełączaniu gry na dwie osoby oraz przy zmianie języka. Ustawienia nie uruchamiają już osobnych ukrytych aplikacji Kindle. System językowy zachowuje oryginalny polski tekst, dzięki czemu przełączanie POLSKI/ENGLISH nie zniekształca napisów. Uporządkowano polskie nazwy i opisy, między innymi Wąż, Piłka na kartce, bicie w przelocie oraz panel administratora.

## Wydanie 3.10.1

Naprawiono aktualizator na instalacjach Kindle, na których `curl` nie potrafi pobrać pliku albo nie ma polecenia `sha256sum`. Skrypt próbuje kolejno `curl` i `wget`, a sumę SHA-256 może sprawdzić przez `sha256sum`, OpenSSL lub Python. Ekran aktualizacji pokazuje teraz bieżący etap oraz konkretny komunikat błędu zapisany przez skrypt.

## Wydanie 3.10.0

Dodano Mahjong Connect, Chińczyka dla 2–4 osób, Piłkę według zasad gry na kartce z Kurnik.pl oraz dostęp do MultiplicatingKid.pl z logowaniem, kontem, klasami, wynikami i panelem administratora. Dane MultiplicatingKid pozostają na jego serwerze, dzięki czemu konto i wyniki są wspólne z wersją przeglądarkową.

Tryb HACKED działa teraz we wszystkich grach i można go wyłączyć trzema dotknięciami napisu INKDECK na ekranie głównym. Komunikat ACCESS GRANTED nie zasłania zawartości Hacket. Poprawiono też nazwę NONOGRAM oraz zachowano układ planszy z klasycznymi wskazówkami wierszy i kolumn.

## Wydanie 3.9.2

Naprawiono mnożenie przycisku kasowania w Sudoku. Sudoku natychmiast wykrywa błędne cyfry, liczy błędy i oferuje podpowiedzi na poziomach 1–2. Nonogram ma teraz zwartą, kwadratową planszę ze wskazówkami przy górnej i lewej krawędzi oraz natychmiast zgłasza pomyłki. Usunięto pasjansa. Hacket otrzymał terminalowy wygląd i ukryty tryb HACKED: siedem dotknięć napisu HACKET włącza ruchy warcabów bez zasad, a trzy dotknięcia nazwy gry wyłączają tryb.

## Wydanie 3.9.1

Poprawiono wyświetlanie Snake, Sudoku, pasjansa i nonogramów w starym silniku Mesquite używanym przez Kindle 5.19.2.0.1. Plansze nie korzystają już z nieobsługiwanego CSS Grid. Usunięto także błąd „Application Error” występujący przy przełączaniu gier na tryb dwóch osób. Ustawienia nadal są zachowywane po zamknięciu aplikacji i restarcie Kindle w trwałej pamięci aplikacji.

## Wydanie 3.9.0

Usunięto grę Cztery w rzędzie i przykładowy, domyślnie dołączony plugin. Dodano Snake, pasjansa Klondike, Sudoku z sześcioma poziomami oraz pięć układów nonogramów (serce 5 × 5, uśmiech i dom 8 × 8, ryba i rakieta 10 × 10). Hacket przewija się jako cała strona; pula Wordle jest wyświetlana większymi, oddzielnymi kafelkami.

Po zakończeniu partii szybkie trzykrotne dotknięcie planszy rozpoczyna nową grę. Przyciski nowej gry są większe. FileSender korzysta z wbudowanego serwera Python, jeśli BusyBox nie zawiera `httpd`, a następnie próbuje BusyBox `httpd`. Aktualizator przygotowuje nową aplikację w katalogu tymczasowym i przełącza ją dopiero po sprawdzeniu plików. Katalog `documents/InkDeck/plugins` pozostaje na urządzeniu, by zachować własne pluginy.

Pluginy mogą definiować własne figury i ruchy przez `InkDeck.registerChessPiece`, `InkDeck.setChessPiece`, `InkDeck.registerCheckerPiece` i `InkDeck.setCheckerPiece`. Loader nie zawiera domyślnej gry-pluginu.
