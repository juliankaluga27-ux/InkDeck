# InkDeck

Offline games and tools for jailbroken Kindle devices. InkDeck runs locally as a Mesquite application and does not require KOReader.

Current version: **3.5.1**

## Features

- games: chess, checkers, Minesweeper, 2048, Tic-tac-toe, Connect Four, Memory, Lights Out, Game of Life and Polish Wordle;
- tools: KindleWriter, sketchpad, task list, scientific calculator and Wi-Fi file upload;
- plugin support;
- optional chess clock for two-player games;
- update checking and installation from GitHub.

## Installation

1. Download `InkDeck-3.5.1.zip` from the newest GitHub release.
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
