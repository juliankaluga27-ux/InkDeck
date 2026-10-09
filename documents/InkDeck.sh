#!/bin/sh
# Name: InkDeck
# Author: Codex
# Icon: /mnt/us/extensions/InkDeck/app/assets/inkdeck-logo.png
# DontUseFBInk
SOURCE_DIR="/mnt/us/extensions/InkDeck/app"
TARGET_DIR="/var/local/mesquite/com.codex.inkdeck-v33"
OLD_TARGET_DIR="/var/local/mesquite/com.codex.inkdeck"
DB="/var/local/appreg.db"
APP_ID="com.codex.inkdeck"
UPDATER_ID="com.codex.inkdeck.updater"
FILES_START_ID="com.codex.inkdeck.files.start"
FILES_STOP_ID="com.codex.inkdeck.files.stop"
SETTINGS_FILE="/mnt/us/extensions/InkDeck/data/settings.txt"
[ -d "$SOURCE_DIR" ] && [ -f "$SOURCE_DIR/main.page" ] || exit 1
chmod 755 "/mnt/us/extensions/InkDeck/bin/"*.sh "/mnt/us/extensions/InkDeck/filebrowser/cgi-bin/"*.sh >/dev/null 2>&1
mkdir -p "$(dirname "$SETTINGS_FILE")"
if [ ! -s "$SETTINGS_FILE" ]; then
cat > "$SETTINGS_FILE" <<'EOF'
language=pl
tttmode=ai
tttlevel=medium
minesize=10
minecount=10
minemode=reveal
memorypairs=8
chessmode=ai
chesslevel=medium
chesstime=0
chessincrement=0
chessstyle=symbols
checkersmode=ai
checkerslevel=medium
checkersrules=polish
checkersstyle=round
connectmode=ai
connectlevel=medium
lifegoal=25
lifepreset=empty
wordlelevel=medium
drawtool=black
drawwidth=6
calcmode=standard
EOF
fi
if [ -d "/mnt/us/documents/InkDeck/plugins" ]; then
    mkdir -p "$SOURCE_DIR/plugins"
    cp -r "/mnt/us/documents/InkDeck/plugins/." "$SOURCE_DIR/plugins/" >/dev/null 2>&1
fi
lipc-set-prop com.lab126.appmgrd stop app://$APP_ID >/dev/null 2>&1
sleep 1
rm -rf "$TARGET_DIR"
rm -rf "$OLD_TARGET_DIR"
rm -rf "/var/local/mesquite/com.codex.inkdeck-v27"
rm -rf "/var/local/mesquite/com.codex.inkdeck-v28"
rm -rf "/var/local/mesquite/com.codex.inkdeck-v30"
rm -rf "/var/local/mesquite/com.codex.inkdeck-v301"
rm -rf "/var/local/mesquite/com.codex.inkdeck-v31"
rm -rf "/var/local/mesquite/com.codex.inkdeck-v32"
cp -r "$SOURCE_DIR" "$TARGET_DIR" || exit 1
mv "$TARGET_DIR/main.page" "$TARGET_DIR/index.html" || exit 1
printf 'window.InkDeckSavedSettings={' > "$TARGET_DIR/settings-loader.js"
while IFS='=' read -r setting_key setting_value; do
    case "$setting_key" in ''|*[!a-z0-9]*) continue ;; esac
    case "$setting_value" in ''|*[!a-zA-Z0-9_-]*) continue ;; esac
    printf '"%s":"%s",' "$setting_key" "$setting_value" >> "$TARGET_DIR/settings-loader.js"
done < "$SETTINGS_FILE"
printf '"_source":"settings.txt"};\n' >> "$TARGET_DIR/settings-loader.js"
: > "$TARGET_DIR/plugins-loader.js"
for plugin in "$SOURCE_DIR"/plugins/*/plugin.js; do
    [ -f "$plugin" ] || continue
    printf '\n/* InkDeck plugin */\n' >> "$TARGET_DIR/plugins-loader.js"
    cat "$plugin" >> "$TARGET_DIR/plugins-loader.js"
done
sqlite3 "$DB" <<EOF
INSERT OR IGNORE INTO interfaces(interface) VALUES('application');
INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('$APP_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','lipcId','$APP_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','command','/usr/bin/mesquite -l $APP_ID -c file://$TARGET_DIR/');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','supportedOrientation','U');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','default-chrome-style','NH');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','searchbar-mode','transient');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','unloadPolicy','unloadOnPause');
INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('$UPDATER_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$UPDATER_ID','lipcId','$UPDATER_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$UPDATER_ID','command','/bin/sh /mnt/us/extensions/InkDeck/bin/update.sh');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$UPDATER_ID','supportedOrientation','U');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$UPDATER_ID','unloadPolicy','unloadOnPause');
INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('$FILES_START_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$FILES_START_ID','lipcId','$FILES_START_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$FILES_START_ID','command','/bin/sh /mnt/us/extensions/InkDeck/bin/filebrowser-start.sh');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$FILES_START_ID','unloadPolicy','unloadOnPause');
INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('$FILES_STOP_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$FILES_STOP_ID','lipcId','$FILES_STOP_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$FILES_STOP_ID','command','/bin/sh /mnt/us/extensions/InkDeck/bin/filebrowser-stop.sh');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$FILES_STOP_ID','unloadPolicy','unloadOnPause');
EOF
SETTINGS_SQL="/tmp/inkdeck-settings-$$.sql"
: > "$SETTINGS_SQL"
while read -r setting_key setting_value; do
    [ -n "$setting_key" ] && [ -n "$setting_value" ] || continue
    setting_id="com.codex.inkdeck.setting.$setting_key.$setting_value"
    printf "INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('%s');\n" "$setting_id" >> "$SETTINGS_SQL"
    printf "INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('%s','lipcId','%s');\n" "$setting_id" "$setting_id" >> "$SETTINGS_SQL"
    printf "INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('%s','command','/bin/sh /mnt/us/extensions/InkDeck/bin/settings-set.sh %s %s');\n" "$setting_id" "$setting_key" "$setting_value" >> "$SETTINGS_SQL"
    printf "INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('%s','unloadPolicy','unloadOnPause');\n" "$setting_id" >> "$SETTINGS_SQL"
done <<'EOF'
language pl
language en
tttmode ai
tttmode two
tttlevel veryeasy
tttlevel easy
tttlevel medium
tttlevel hard
tttlevel master
minesize 8
minesize 10
minesize 12
minecount 5
minecount 10
minecount 15
minecount 20
minecount 25
minemode reveal
minemode flag
memorypairs 6
memorypairs 8
memorypairs 10
chessmode ai
chessmode two
chesslevel veryeasy
chesslevel easy
chesslevel medium
chesslevel hard
chesslevel master
chesstime 0
chesstime 180
chesstime 300
chesstime 600
chessincrement 0
chessincrement 1
chessincrement 2
chessincrement 3
chessincrement 5
chessincrement 10
chessincrement 15
chessincrement 30
chessstyle symbols
chessstyle simple
chessstyle letters
checkersmode ai
checkersmode two
checkerslevel veryeasy
checkerslevel easy
checkerslevel medium
checkerslevel hard
checkerslevel master
checkersrules polish
checkersrules english
checkersstyle round
checkersstyle flat
connectmode ai
connectmode two
connectlevel veryeasy
connectlevel easy
connectlevel medium
connectlevel hard
connectlevel master
lifegoal 0
lifegoal 10
lifegoal 25
lifegoal 50
lifegoal 100
lifepreset empty
lifepreset glider
lifepreset beacon
lifepreset pulsar
lifepreset random
wordlelevel easy
wordlelevel medium
wordlelevel hard
drawtool black
drawtool dark
drawtool gray
drawtool light
drawtool eraser
drawwidth 3
drawwidth 6
drawwidth 12
calcmode standard
calcmode scientific
EOF
sqlite3 "$DB" < "$SETTINGS_SQL"
rm -f "$SETTINGS_SQL"
rm -f "/mnt/us/documents/InkDeck Update 2.7.sh"
rm -f "/mnt/us/documents/InkDeck Update 2.8.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.0.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.0.1.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.1.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.2.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.3.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.4.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.4.1.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.4.2.sh"
rm -f "/mnt/us/documents/InkDeck Update 3.4.3.sh"
rm -f "/mnt/us/documents/InkDeck-update-status.txt"
rm -f "/mnt/us/documents/InkDeck-filebrowser-status.txt"
rm -f "/mnt/us/INSTRUKCJA.txt"
rm -f "/mnt/us/ODINSTALUJ/Uninstall InkDeck.sh"
rmdir "/mnt/us/ODINSTALUJ" >/dev/null 2>&1
rm -rf "/mnt/us/documents/InkDeck"
nohup lipc-set-prop com.lab126.appmgrd start app://$APP_ID >/dev/null 2>&1 &
exit 0
