#!/bin/sh
# Name: InkDeck
# Author: Codex
# Icon: /mnt/us/documents/InkDeck/assets/inkdeck-logo.png
# DontUseFBInk
SOURCE_DIR="/mnt/us/documents/InkDeck"
TARGET_DIR="/var/local/mesquite/com.codex.inkdeck-v33"
OLD_TARGET_DIR="/var/local/mesquite/com.codex.inkdeck"
DB="/var/local/appreg.db"
APP_ID="com.codex.inkdeck"
UPDATER_ID="com.codex.inkdeck.updater"
[ -d "$SOURCE_DIR" ] && [ -f "$SOURCE_DIR/index.html" ] || exit 1
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
EOF
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
nohup lipc-set-prop com.lab126.appmgrd start app://$APP_ID >/dev/null 2>&1 &
exit 0
