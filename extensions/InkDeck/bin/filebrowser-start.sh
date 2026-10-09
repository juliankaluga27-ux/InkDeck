#!/bin/sh

ROOT="/mnt/us/extensions/InkDeck/filebrowser"
DEST="/mnt/us/documents/Uploads"
PIDFILE="/tmp/inkdeck-filebrowser.pid"
PINFILE="/tmp/inkdeck-filebrowser.pin"
STATUS="/mnt/us/extensions/InkDeck/filebrowser-status.txt"
PORT=8080

if [ -f "$PIDFILE" ]; then
    oldpid="$(cat "$PIDFILE" 2>/dev/null)"
    if [ -n "$oldpid" ] && kill -0 "$oldpid" 2>/dev/null; then
        exit 0
    fi
    rm -f "$PIDFILE"
fi

PYTHON=""
if command -v python3 >/dev/null 2>&1; then PYTHON="$(command -v python3)"; elif command -v python >/dev/null 2>&1; then PYTHON="$(command -v python)"; fi
if [ -z "$PYTHON" ] && ! busybox --list 2>/dev/null | grep -q '^httpd$'; then
    printf 'BLAD: brak Python i BusyBox httpd. Ten firmware nie ma dostepnego serwera HTTP.\n' > "$STATUS"
    exit 1
fi

mkdir -p "$DEST" || exit 1
pin="$(date +%s | awk '{print substr($0,length($0)-3)}')"
[ -n "$pin" ] || pin="2468"
printf '%s' "$pin" > "$PINFILE"

ipaddr="$(ip -4 addr show wlan0 2>/dev/null | awk '/inet /{split($2,a,"/");print a[1];exit}')"
if [ -z "$ipaddr" ]; then
    ipaddr="$(ifconfig wlan0 2>/dev/null | awk '/inet addr:/{split($2,a,":");print a[2];exit} /inet /{print $2;exit}')"
fi
if [ -z "$ipaddr" ]; then
    printf 'BLAD: Kindle nie jest polaczony z Wi-Fi.\n' > "$STATUS"
    exit 1
fi

if [ -n "$PYTHON" ]; then
    "$PYTHON" "$ROOT/server.py" >/tmp/inkdeck-filebrowser.log 2>&1 &
else
    busybox httpd -f -p "$PORT" -h "$ROOT" >/tmp/inkdeck-filebrowser.log 2>&1 &
fi
serverpid=$!
printf '%s' "$serverpid" > "$PIDFILE"
sleep 1
if ! kill -0 "$serverpid" 2>/dev/null; then
    printf 'BLAD: nie udalo sie uruchomic serwera.\n' > "$STATUS"
    rm -f "$PIDFILE" "$PINFILE"
    exit 1
fi

printf 'OTWORZ NA TELEFONIE: http://%s:%s/cgi-bin/home.sh\nPIN: %s\nPliki trafia do documents/Uploads.\n' "$ipaddr" "$PORT" "$pin" > "$STATUS"
if command -v eips >/dev/null 2>&1; then
    eips 1 36 "Pliki: http://$ipaddr:$PORT/cgi-bin/home.sh  PIN: $pin" >/dev/null 2>&1
fi
exit 0
