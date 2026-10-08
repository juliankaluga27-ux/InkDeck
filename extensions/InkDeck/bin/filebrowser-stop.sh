#!/bin/sh

PIDFILE="/tmp/inkdeck-filebrowser.pid"
PINFILE="/tmp/inkdeck-filebrowser.pin"
STATUS="/mnt/us/extensions/InkDeck/filebrowser-status.txt"

if [ -f "$PIDFILE" ]; then
    pid="$(cat "$PIDFILE" 2>/dev/null)"
    case "$pid" in
        *[!0-9]*|'') ;;
        *) kill "$pid" >/dev/null 2>&1 ;;
    esac
fi
rm -f "$PIDFILE" "$PINFILE"
printf 'Serwer plikow jest wylaczony.\n' > "$STATUS"
exit 0
