#!/bin/sh

DEST="/mnt/us/documents/Uploads"
PINFILE="/tmp/inkdeck-filebrowser.pin"
MAX_BYTES=52428800

reply() {
    printf 'Content-Type: text/plain\r\n'
    printf 'Cache-Control: no-store\r\n\r\n'
    printf '%s\n' "$1"
}

expected="$(cat "$PINFILE" 2>/dev/null)"
pin="$(printf '%s' "$QUERY_STRING" | sed -n 's/.*pin=\([^&]*\).*/\1/p')"
name="$(printf '%s' "$QUERY_STRING" | sed -n 's/.*name=\([^&]*\).*/\1/p' | tr -cd 'A-Za-z0-9._-')"

if [ -z "$expected" ] || [ "$pin" != "$expected" ]; then
    reply "BLAD: zly PIN"
    exit 1
fi
if [ "$REQUEST_METHOD" != "POST" ]; then
    reply "BLAD: wymagany POST"
    exit 1
fi
case "$CONTENT_LENGTH" in
    *[!0-9]*|'') reply "BLAD: brak rozmiaru pliku"; exit 1 ;;
esac
if [ "$CONTENT_LENGTH" -gt "$MAX_BYTES" ]; then
    reply "BLAD: plik jest wiekszy niz 50 MB"
    exit 1
fi
case "$name" in
    ''|.*) name="plik-$(date +%s).bin" ;;
esac
mkdir -p "$DEST" || { reply "BLAD: nie mozna utworzyc folderu"; exit 1; }
cat > "$DEST/$name" || { reply "BLAD: zapis nie udal sie"; exit 1; }
reply "OK: $name"
exit 0
