#!/bin/sh

REPO="juliankaluga27-ux/InkDeck"
DOCS="/mnt/us/documents"
EXTENSIONS="/mnt/us/extensions"
STAGE="$DOCS/.inkdeck-update-$$"
ARCHIVE="$STAGE/InkDeck-update.tar.gz"
CHECKSUM="$STAGE/InkDeck-update.tar.gz.sha256"
UNPACK="$STAGE/unpacked"
BACKUP="$DOCS/InkDeck.backup"
LOG="$DOCS/InkDeck-update-status.txt"
BASE_URL="https://github.com/$REPO/releases/latest/download"

status() {
    printf '%s\n' "$1" > "$LOG"
    if command -v eips >/dev/null 2>&1; then
        eips 1 38 "$1" >/dev/null 2>&1
    fi
}

cleanup() {
    case "$STAGE" in
        "$DOCS"/.inkdeck-update-*) rm -rf "$STAGE" ;;
    esac
}

fail() {
    status "InkDeck: aktualizacja nieudana. Szczegoly: documents/InkDeck-update-status.txt"
    cleanup
    exit 1
}

download() {
    url="$1"
    target="$2"
    if command -v curl >/dev/null 2>&1; then
        curl --fail --location --connect-timeout 20 --max-time 180 "$url" -o "$target"
        return $?
    fi
    if command -v wget >/dev/null 2>&1; then
        wget -T 20 -O "$target" "$url"
        return $?
    fi
    return 1
}

mkdir -p "$STAGE" "$UNPACK" || fail
status "InkDeck: pobieranie aktualizacji..."
download "$BASE_URL/InkDeck-update.tar.gz" "$ARCHIVE" || fail
download "$BASE_URL/InkDeck-update.tar.gz.sha256" "$CHECKSUM" || fail

if ! command -v sha256sum >/dev/null 2>&1; then
    status "InkDeck: brak sha256sum — aktualizacja przerwana."
    cleanup
    exit 1
fi
(cd "$STAGE" && sha256sum -c "InkDeck-update.tar.gz.sha256") >/dev/null 2>&1 || fail
tar -xzf "$ARCHIVE" -C "$UNPACK" || fail

[ -f "$UNPACK/documents/InkDeck/index.html" ] || fail
[ -f "$UNPACK/documents/InkDeck/app.js" ] || fail
[ -f "$UNPACK/documents/InkDeck.sh" ] || fail
[ -f "$UNPACK/extensions/InkDeck/bin/update.sh" ] || fail

status "InkDeck: instalowanie..."
lipc-set-prop com.lab126.appmgrd stop app://com.codex.inkdeck >/dev/null 2>&1
sleep 1

rm -rf "$BACKUP"
if [ -d "$DOCS/InkDeck" ]; then
    mv "$DOCS/InkDeck" "$BACKUP" || fail
fi
cp -r "$UNPACK/documents/InkDeck" "$DOCS/InkDeck" || {
    rm -rf "$DOCS/InkDeck"
    [ -d "$BACKUP" ] && mv "$BACKUP" "$DOCS/InkDeck"
    fail
}
cp "$UNPACK/documents/InkDeck.sh" "$DOCS/InkDeck.sh" || fail
mkdir -p "$EXTENSIONS/InkDeck/bin" || fail
cp "$UNPACK/extensions/InkDeck/menu.json" "$EXTENSIONS/InkDeck/menu.json" || fail
cp "$UNPACK/extensions/InkDeck/bin/update.sh" "$EXTENSIONS/InkDeck/bin/update.sh" || fail
chmod 755 "$EXTENSIONS/InkDeck/bin/update.sh" "$DOCS/InkDeck.sh" >/dev/null 2>&1

sh "$DOCS/InkDeck.sh" || {
    rm -rf "$DOCS/InkDeck"
    [ -d "$BACKUP" ] && mv "$BACKUP" "$DOCS/InkDeck"
    fail
}

rm -rf "$BACKUP"
status "InkDeck: aktualizacja zakonczona."
cleanup
exit 0
