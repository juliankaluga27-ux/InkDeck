#!/bin/sh
# Name: Uninstall InkDeck
# Author: Codex
# DontUseFBInk

APP_ID="com.codex.inkdeck"
UPDATER_ID="com.codex.inkdeck.updater"
TARGET_DIR="/var/local/mesquite/com.codex.inkdeck"
TARGET_DIR_V27="/var/local/mesquite/com.codex.inkdeck-v27"
TARGET_DIR_V28="/var/local/mesquite/com.codex.inkdeck-v28"
TARGET_DIR_V30="/var/local/mesquite/com.codex.inkdeck-v30"
TARGET_DIR_V301="/var/local/mesquite/com.codex.inkdeck-v301"
TARGET_DIR_V31="/var/local/mesquite/com.codex.inkdeck-v31"
TARGET_DIR_V32="/var/local/mesquite/com.codex.inkdeck-v32"
TARGET_DIR_V33="/var/local/mesquite/com.codex.inkdeck-v33"
DB="/var/local/appreg.db"

lipc-set-prop com.lab126.appmgrd stop app://$APP_ID >/dev/null 2>&1
rm -rf "$TARGET_DIR"
rm -rf "$TARGET_DIR_V27"
rm -rf "$TARGET_DIR_V28"
rm -rf "$TARGET_DIR_V30"
rm -rf "$TARGET_DIR_V301"
rm -rf "$TARGET_DIR_V31"
rm -rf "$TARGET_DIR_V32"
rm -rf "$TARGET_DIR_V33"
sqlite3 "$DB" <<EOF
DELETE FROM properties WHERE handlerId='$APP_ID';
DELETE FROM handlerIds WHERE handlerId='$APP_ID';
DELETE FROM properties WHERE handlerId='$UPDATER_ID';
DELETE FROM handlerIds WHERE handlerId='$UPDATER_ID';
EOF
exit 0
