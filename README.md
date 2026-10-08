# InkDeck

Offline games and tools for jailbroken Kindle devices. InkDeck runs locally as a Mesquite application and does not require KOReader.

Current version: **3.4.2**

## Features

- games: chess, checkers, Minesweeper, 2048, Tic-tac-toe, Connect Four, Memory, Lights Out, Game of Life and Polish Wordle;
- tools: KindleWriter, sketchpad, task list and scientific calculator;
- plugin support;
- optional chess clock for two-player games;
- update checking and installation from GitHub.

## Installation

1. Download `InkDeck-3.4.2.zip` from the newest GitHub release.
2. Copy both folders, `documents` and `extensions`, to the USB root of the Kindle.
3. Safely disconnect the Kindle.
4. Run **InkDeck Update 3.4.2** from the library. This one-time installer removes itself after installation.

The `documents` directory contains the Mesquite application. The `extensions/InkDeck` directory contains the updater backend and an optional KUAL menu entry. Updates can normally be started from **Tools → Updates** inside InkDeck.

## Safe updates

The updater downloads release assets only from this repository, verifies their SHA-256 checksum, validates the package structure and keeps a backup until installation succeeds. If downloading or verification fails, the installed application is not replaced.

## Compatibility

Developed for a jailbroken Kindle Basic 11th generation running firmware 5.19.2.0.1 with Véra and Mesquite. Other models may require layout adjustments.

## Uninstalling

Run `ODINSTALUJ/Uninstall InkDeck.sh`. User files stored in the USB-visible `documents` directory are not deleted automatically.
