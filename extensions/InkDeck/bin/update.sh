#!/bin/sh

REPO="juliankaluga27-ux/InkDeck"
DOCS="/mnt/us/documents"
EXTENSIONS="/mnt/us/extensions"
STAGE="/tmp/inkdeck-update-$$"
ARCHIVE="$STAGE/InkDeck-update.tar.gz"
CHECKSUM="$STAGE/InkDeck-update.tar.gz.sha256"
UNPACK="$STAGE/unpacked"
BACKUP="$STAGE/app-backup"
LOG="$EXTENSIONS/InkDeck/update-status.txt"
BASE_URL="https://github.com/$REPO/releases/latest/download"

status() {
    printf '%s\n' "$1" > "$LOG"
    if command -v eips >/dev/null 2>&1; then
        eips 1 38 "$1" >/dev/null 2>&1
    fi
}

cleanup() {
    case "$STAGE" in
        /tmp/inkdeck-update-*) rm -rf "$STAGE" ;;
    esac
}

fail() {
    reason="${1:-nieznany blad}"
    printf 'InkDeck: aktualizacja nieudana: %s\n' "$reason" > "$LOG"
    if command -v eips >/dev/null 2>&1; then
        eips 1 38 "InkDeck: blad aktualizacji. Sprawdz extensions/InkDeck/update-status.txt" >/dev/null 2>&1
    fi
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

mkdir -p "$STAGE" "$UNPACK" || fail "nie mozna utworzyc katalogu roboczego"
status "InkDeck: pobieranie aktualizacji..."
download "$BASE_URL/InkDeck-update.tar.gz" "$ARCHIVE" || fail "nie udalo sie pobrac paczki; sprawdz Wi-Fi i date Kindle"
download "$BASE_URL/InkDeck-update.tar.gz.sha256" "$CHECKSUM" || fail "nie udalo sie pobrac sumy SHA-256"

if ! command -v sha256sum >/dev/null 2>&1; then
    status "InkDeck: brak sha256sum — aktualizacja przerwana."
    cleanup
    exit 1
fi
(cd "$STAGE" && sha256sum -c "InkDeck-update.tar.gz.sha256") >/dev/null 2>&1 || fail "paczka nie przeszla kontroli SHA-256"
tar -xzf "$ARCHIVE" -C "$UNPACK" || fail "nie udalo sie rozpakowac paczki"

[ -f "$UNPACK/extensions/InkDeck/app/main.page" ] || fail "brak strony aplikacji"
[ -f "$UNPACK/extensions/InkDeck/app/app.js" ] || fail "brak app.js"
[ -f "$UNPACK/documents/InkDeck.sh" ] || fail "brak launchera"
[ -f "$UNPACK/extensions/InkDeck/bin/update.sh" ] || fail "brak modulu aktualizacji"

status "InkDeck: instalowanie..."
lipc-set-prop com.lab126.appmgrd stop app://com.codex.inkdeck >/dev/null 2>&1
sleep 1

if [ -d "$EXTENSIONS/InkDeck/app" ]; then
    cp -r "$EXTENSIONS/InkDeck/app" "$BACKUP" || fail "nie udalo sie zrobic kopii aplikacji"
fi
if [ ! -f "$DOCS/InkDeck.sh" ] || ! cmp -s "$UNPACK/documents/InkDeck.sh" "$DOCS/InkDeck.sh"; then
    cp "$UNPACK/documents/InkDeck.sh" "$DOCS/InkDeck.sh" || fail "nie udalo sie zapisac launchera"
fi
mkdir -p "$EXTENSIONS/InkDeck/bin" || fail
cp -r "$UNPACK/extensions/InkDeck/." "$EXTENSIONS/InkDeck/" || fail "nie udalo sie skopiowac modulu extensions"
rm -f "$EXTENSIONS/InkDeck/filebrowser/index.html"
rm -f "$EXTENSIONS/InkDeck/app/plugins/README.txt"
chmod 755 "$EXTENSIONS/InkDeck/bin/"*.sh "$EXTENSIONS/InkDeck/filebrowser/cgi-bin/"*.sh "$DOCS/InkDeck.sh" >/dev/null 2>&1

sh "$DOCS/InkDeck.sh" || {
    rm -rf "$EXTENSIONS/InkDeck/app"
    [ -d "$BACKUP" ] && cp -r "$BACKUP" "$EXTENSIONS/InkDeck/app"
    fail
}

status "InkDeck: aktualizacja zakonczona."
cleanup
exit 0
