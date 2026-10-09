# InkDeck

Offline games and tools for jailbroken Kindle devices. InkDeck runs locally as a Mesquite application and does not require KOReader.

Current version: **3.9.0**

## Features

- games: chess, checkers, Minesweeper, 2048, Tic-tac-toe, Memory, Lights Out, Game of Life, Snake, Klondike Solitaire, six-level Sudoku, Nonograms and Polish or English Wordle;
- tools: KindleWriter, sketchpad, task list, scientific calculator and Wi-Fi file upload;
- plugin support;
- optional chess clock for two-player games;
- configurable time increment after every move in two-player chess;
- Polish 8 × 8 checkers with backward captures and flying kings, plus classic English rules;
- a stronger chess bot that detects checkmate and avoids repeated positions;
- a Mesquite-compatible continuous drawing mode in the sketchpad;
- the hidden **Hacket** reference with Wordle pools, game rules and technical secrets;
- persistent game settings and difficulty levels stored in `extensions/InkDeck/data/settings.txt`;
- update checking and installation from GitHub.

## Installation

1. Download `InkDeck-3.9.0.zip` from the newest GitHub release.
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

Aktualna wersja: **3.9.0**

## Funkcje

- szachy, warcaby, Saper, 2048, kółko i krzyżyk, Pamięć, Zgaś światła, Gra w życie, Snake, pasjans Klondike, sześciopoziomowe Sudoku, nonogramy i polskie lub angielskie Wordle;
- KindleWriter, szkicownik, lista zadań, kalkulator naukowy i przesyłanie plików przez Wi-Fi;
- szachy dla dwóch osób z zegarem i przyrostem czasu po każdym ruchu;
- dwa warianty warcabów: **polskie 8 × 8** z biciem pionem do tyłu i latającą damką oraz **angielskie** z krótką damką;
- poprawiony bot szachowy, który rozpoznaje mata i unika bezsensownego powtarzania pozycji;
- szkicownik rysujący płynne linie na silniku Mesquite;
- ukryta sekcja **Hacket** z pełnymi pulami Wordle, zasadami gier i technicznymi smaczkami;
- trwały zapis ustawień i poziomów trudności w `extensions/InkDeck/data/settings.txt`;
- bezpieczna aktualizacja bezpośrednio z GitHuba.

## Instalacja

1. Pobierz `InkDeck-3.9.0.zip` z najnowszego wydania GitHub.
2. Skopiuj foldery `documents` oraz `extensions` do głównego katalogu pamięci USB Kindle.
3. Bezpiecznie odłącz Kindle od komputera.
4. Uruchom **InkDeck** z biblioteki. Ten sam skrót instaluje i otwiera aplikację.

Aktualizacje można później instalować bez komputera z poziomu **Narzędzia → Aktualizacje**. Istniejący plik ustawień zostaje zachowany.

## Ukryta sekcja Hacket

Aby ją otworzyć, na ekranie głównym dotknij szybko **7 razy napisu INKDECK** u góry. Hacket nie jest widoczny na liście gier ani narzędzi.

## Zgodność

Projekt jest przygotowany dla Kindle Basic 11. generacji / Kids z firmware 5.19.2.0.1, Véra i Mesquite. Na innych modelach układ może wymagać dopasowania.

## Wydanie 3.9.0

Usunięto grę Cztery w rzędzie i przykładowy, domyślnie dołączony plugin. Dodano Snake, pasjansa Klondike, Sudoku z sześcioma poziomami oraz pięć układów nonogramów (serce 5 × 5, uśmiech i dom 8 × 8, ryba i rakieta 10 × 10). Hacket przewija się jako cała strona; pula Wordle jest wyświetlana większymi, oddzielnymi kafelkami.

Po zakończeniu partii szybkie trzykrotne dotknięcie planszy rozpoczyna nową grę. Przyciski nowej gry są większe. FileSender korzysta z wbudowanego serwera Python, jeśli BusyBox nie zawiera `httpd`, a następnie próbuje BusyBox `httpd`. Aktualizator przygotowuje nową aplikację w katalogu tymczasowym i przełącza ją dopiero po sprawdzeniu plików. Katalog `documents/InkDeck/plugins` pozostaje na urządzeniu, by zachować własne pluginy.

Pluginy mogą definiować własne figury i ruchy przez `InkDeck.registerChessPiece`, `InkDeck.setChessPiece`, `InkDeck.registerCheckerPiece` i `InkDeck.setCheckerPiece`. Loader nie zawiera domyślnej gry-pluginu.
