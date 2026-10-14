#!/bin/sh
# Detach from appmgrd: returning to InkDeck must not terminate a download.
if [ "${1:-}" != "--worker" ]; then
    mode="${1:---install}"
    worker="/tmp/inkdeck-updater-worker-$$.sh"
    cp "$0" "$worker" || exit 1
    if command -v setsid >/dev/null 2>&1; then
        setsid sh "$worker" --worker "$mode" </dev/null >/dev/null 2>&1 &
    else
        nohup sh "$worker" --worker "$mode" </dev/null >/dev/null 2>&1 &
    fi
    # Script apps pause Mesquite. Restore it while the detached worker runs.
    (sleep 1; lipc-set-prop com.lab126.appmgrd start app://com.codex.inkdeck >/dev/null 2>&1) </dev/null >/dev/null 2>&1 &
    exit 0
fi
MODE="${2:---install}"
case "$MODE" in --install|--download-only) ;; *) exit 1 ;; esac
REPO="juliankaluga27-ux/InkDeck"
DOCS="/mnt/us/documents"
EXTENSIONS="/mnt/us/extensions"
STAGE="/tmp/inkdeck-update-$$"
UNPACK="$STAGE/unpacked"
MANIFEST="$STAGE/manifest.txt"
BACKUP="$STAGE/backup"
LOG="$EXTENSIONS/InkDeck/update-status.txt"
DETAIL_LOG="$EXTENSIONS/InkDeck/update-detail.txt"
LOCK="/tmp/inkdeck-update.lock"
BASE_URL="https://github.com/$REPO/releases/latest/download"
DATA="$EXTENSIONS/InkDeck/data"
CACHE="$DATA/update-cache"
READY="$DATA/update-ready.txt"
mkdir -p "$DATA" || exit 1
using_cache=0
if ! mkdir "$LOCK" 2>/dev/null; then
    previous_pid="$(cat "$LOCK/pid" 2>/dev/null)"
    case "$previous_pid" in ''|*[!0-9]*) exit 0 ;; esac
    kill -0 "$previous_pid" 2>/dev/null && exit 0
    rm -rf "$LOCK"
    mkdir "$LOCK" 2>/dev/null || exit 0
fi
printf '%s\n' "$$" > "$LOCK/pid"
status() {
    printf '%s\n' "$1" > "$LOG.tmp.$$"
    mv "$LOG.tmp.$$" "$LOG"
    printf '%s %s\n' "$(date '+%H:%M:%S')" "$1" >> "$DETAIL_LOG"
}
cleanup() {
    case "$STAGE" in /tmp/inkdeck-update-*) rm -rf "$STAGE" ;; esac
    case "$0" in /tmp/inkdeck-updater-worker-*.sh) rm -f "$0" ;; esac
    [ "$(cat "$LOCK/pid" 2>/dev/null)" = "$$" ] && rm -rf "$LOCK"
}
fail() {
    status "InkDeck: aktualizacja nieudana: ${1:-nieznany blad}. Szczegoly: extensions/InkDeck/update-detail.txt"
    exit 1
}
trap cleanup 0
trap 'fail "proces przerwany"' 1 2 15
mkdir -p "$STAGE" "$UNPACK" || fail "brak miejsca na pliki robocze"
: > "$DETAIL_LOG"
command -v sha256sum >/dev/null 2>&1 || command -v openssl >/dev/null 2>&1 || fail "brak sha256sum lub openssl do sprawdzania plikow"
# Bound both curl and wget, including implementations with ineffective timeouts.
bounded() (
    "$@" >> "$DETAIL_LOG" 2>&1 &
    fetch_pid=$!
    (sleep 40; kill -TERM "$fetch_pid" 2>/dev/null; sleep 1; kill -KILL "$fetch_pid" 2>/dev/null) &
    guard_pid=$!
    wait "$fetch_pid"
    result=$?
    kill "$guard_pid" 2>/dev/null
    wait "$guard_pid" 2>/dev/null
    exit "$result"
)
download() (
    url="$1"; target="$2"
    if command -v curl >/dev/null 2>&1; then
        bounded curl --fail --location --silent --show-error --connect-timeout 10 --max-time 35 "$url" -o "$target" && exit 0
    fi
    if command -v wget >/dev/null 2>&1; then
        bounded wget -T 15 -t 1 -O "$target" "$url" && exit 0
    fi
    exit 1
)
verify_file() (
    expected="$1"; file="$2"
    [ -f "$file" ] || exit 1
    case "$expected" in ''|*[!0-9a-f]*) exit 1 ;; esac
    [ "${#expected}" -eq 64 ] || exit 1
    if command -v sha256sum >/dev/null 2>&1; then
        actual="$(sha256sum "$file" 2>/dev/null | awk '{ print $1 }')"
    else
        actual="$(openssl dgst -sha256 "$file" 2>/dev/null | awk '{ print $NF }')"
    fi
    [ "$actual" = "$expected" ]
)
if [ "$MODE" = "--install" ] && [ -s "$READY" ] && [ -s "$CACHE/manifest.txt" ]; then
    cp "$CACHE/manifest.txt" "$MANIFEST" || fail "nie mozna odczytac pobranej aktualizacji"
    using_cache=1
else
    command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1 || fail "brak curl lub wget"
    status "InkDeck: pobieranie listy plikow (limit 40 s na polaczenie)..."
    download "$BASE_URL/InkDeck-update-manifest.txt" "$MANIFEST" || fail "nie mozna pobrac manifestu; sprawdz Wi-Fi i date Kindle"
fi
total=0
while IFS=' ' read -r expected path url extra; do
    [ -n "$expected" ] || continue
    case "$path" in documents/InkDeck.sh|extensions/InkDeck/*) ;; *) fail "nieprawidlowa sciezka manifestu" ;; esac
    case "$path" in *..*|/*) fail "nieprawidlowa sciezka manifestu" ;; esac
    case "$url" in https://raw.githubusercontent.com/juliankaluga27-ux/InkDeck/v*/"$path") ;; *) fail "nieprawidlowy adres manifestu" ;; esac
    case "$expected" in *[!0-9a-f]*) fail "nieprawidlowa suma SHA-256" ;; esac
    [ "${#expected}" -eq 64 ] && [ -z "$extra" ] || fail "nieprawidlowy rekord manifestu"
    total=$((total + 1))
done < "$MANIFEST"
[ "$total" -ge 5 ] && [ "$total" -le 200 ] || fail "niepelna lista plikow"
count=0; changed=0
while IFS=' ' read -r expected path url; do
    [ -n "$expected" ] || continue
    count=$((count + 1))
    target="$UNPACK/$path"
    mkdir -p "${target%/*}" || fail "brak miejsca dla $path"
    status "InkDeck: plik $count/$total: ${path##*/}"
    if verify_file "$expected" "/mnt/us/$path"; then
        cp "/mnt/us/$path" "$target" || fail "blad kopiowania $path"
    elif verify_file "$expected" "$CACHE/files/$path"; then
        changed=$((changed + 1))
        cp "$CACHE/files/$path" "$target" || fail "nie mozna odczytac pobranego $path"
    else
        changed=$((changed + 1))
        [ "$using_cache" -eq 0 ] || { rm -f "$READY"; rm -rf "$CACHE"; fail "pobrany plik $path jest uszkodzony; ponow probe, aby pobrac ponownie"; }
        download "$url" "$target" || fail "nie mozna pobrac $path (limit czasu lub blad sieci)"
    fi
    verify_file "$expected" "$target" || fail "bledna suma SHA-256: $path"
done < "$MANIFEST"
for path in app/main.page app/app.js app/style.css app/new-games.js app/extra-games.js bin/update.sh; do
    [ -s "$UNPACK/extensions/InkDeck/$path" ] || fail "brak $path w aktualizacji"
done
[ -s "$UNPACK/documents/InkDeck.sh" ] || fail "brak launchera"
sh -n "$UNPACK/documents/InkDeck.sh" || fail "blad skladni launchera"
sh -n "$UNPACK/extensions/InkDeck/bin/update.sh" || fail "blad skladni aktualizatora"
if [ "$changed" -eq 0 ]; then
    rm -f "$READY"
    rm -rf "$CACHE"
    status "InkDeck: aktualizacja zakonczona. Masz najnowsze pliki ($total/$total)."
    exit 0
fi
version="$(sed -n 's/.*version="\([^" ]*\)".*/\1/p' "$UNPACK/extensions/InkDeck/app/config.xml" | head -n 1)"
case "$version" in ''|*[!a-zA-Z0-9.-]*) fail "brak poprawnego numeru wersji" ;; esac
if [ "$MODE" = "--download-only" ]; then
    candidate="$DATA/update-cache.new.$$"
    mkdir -p "$candidate" || fail "brak miejsca na gotowa aktualizacje"
    cp -r "$UNPACK" "$candidate/files" && cp "$MANIFEST" "$candidate/manifest.txt" || { rm -rf "$candidate"; fail "nie mozna zapisac aktualizacji"; }
    rm -rf "$CACHE.previous"
    [ ! -d "$CACHE" ] || mv "$CACHE" "$CACHE.previous" || fail "nie mozna wymienic pobranych plikow"
    if ! mv "$candidate" "$CACHE"; then
        [ ! -d "$CACHE.previous" ] || mv "$CACHE.previous" "$CACHE"
        fail "nie mozna zapisac pobranych plikow"
    fi
    rm -rf "$CACHE.previous"
    printf '%s\n' "$version" > "$READY.new" && mv "$READY.new" "$READY" || fail "nie mozna zapisac wersji"
    status "InkDeck: pobrana aktualizacja $version; gotowa do instalacji."
    exit 0
fi
status "InkDeck: instalowanie $changed zmienionych plikow..."
cp -r "$EXTENSIONS/InkDeck" "$BACKUP" || fail "nie mozna utworzyc kopii zapasowej"
cp "$DOCS/InkDeck.sh" "$STAGE/launcher-backup.sh" || fail "nie mozna zachowac launchera"
rollback() {
    cp -r "$BACKUP/." "$EXTENSIONS/InkDeck/"
    cp "$STAGE/launcher-backup.sh" "$DOCS/InkDeck.sh"
}
cp "$UNPACK/documents/InkDeck.sh" "$DOCS/InkDeck.sh" && cp -r "$UNPACK/extensions/InkDeck/." "$EXTENSIONS/InkDeck/" || { rollback; fail "blad zapisu; przywrocono kopie"; }
chmod 755 "$EXTENSIONS/InkDeck/bin/"*.sh "$DOCS/InkDeck.sh" >/dev/null 2>&1
# Clear readiness before relaunch so the new UI does not offer the same update.
rm -f "$READY"
rm -rf "$CACHE"
printf '%s\n' "$version" > "$DATA/installed-version.txt"
status "InkDeck: uruchamianie nowej wersji $version..."
sh "$DOCS/InkDeck.sh" >> "$DETAIL_LOG" 2>&1 || { rollback; fail "blad uruchomienia; przywrocono kopie"; }
status "InkDeck: aktualizacja zakonczona ($total/$total plikow)."
exit 0
