#!/bin/sh

KEY="$1"
VALUE="$2"
SETTINGS_FILE="${INKDECK_SETTINGS_FILE:-/mnt/us/extensions/InkDeck/data/settings.txt}"

case "$KEY:$VALUE" in
    language:pl|language:en|\
    tttmode:ai|tttmode:two|\
    tttlevel:veryeasy|tttlevel:easy|tttlevel:medium|tttlevel:hard|tttlevel:master|\
    minesize:8|minesize:10|minesize:12|\
    minecount:5|minecount:10|minecount:15|minecount:20|minecount:25|\
    minemode:reveal|minemode:flag|\
    memorypairs:6|memorypairs:8|memorypairs:10|\
    chessmode:ai|chessmode:two|\
    chesslevel:veryeasy|chesslevel:easy|chesslevel:medium|chesslevel:hard|chesslevel:master|\
    chesstime:0|chesstime:180|chesstime:300|chesstime:600|\
    chessincrement:0|chessincrement:1|chessincrement:2|chessincrement:3|chessincrement:5|chessincrement:10|chessincrement:15|chessincrement:30|\
    chessstyle:symbols|chessstyle:simple|chessstyle:letters|\
    checkersmode:ai|checkersmode:two|\
    checkerslevel:veryeasy|checkerslevel:easy|checkerslevel:medium|checkerslevel:hard|checkerslevel:master|\
    checkersrules:polish|checkersrules:english|\
    checkersstyle:round|checkersstyle:flat|\
    sudokulevel:1|sudokulevel:2|sudokulevel:3|sudokulevel:4|sudokulevel:5|sudokulevel:6|\
    lifegoal:0|lifegoal:10|lifegoal:25|lifegoal:50|lifegoal:100|\
    lifepreset:empty|lifepreset:glider|lifepreset:beacon|lifepreset:pulsar|lifepreset:random|\
    wordlelevel:easy|wordlelevel:medium|wordlelevel:hard|\
    drawtool:black|drawtool:dark|drawtool:gray|drawtool:light|drawtool:eraser|\
    drawwidth:3|drawwidth:6|drawwidth:12|\
    calcmode:standard|calcmode:scientific) ;;
    *) exit 1 ;;
esac

mkdir -p "$(dirname "$SETTINGS_FILE")" || exit 1
TMP_FILE="$SETTINGS_FILE.tmp.$$"
if [ -f "$SETTINGS_FILE" ]; then
    awk -F= -v wanted="$KEY" '$1 != wanted { print }' "$SETTINGS_FILE" > "$TMP_FILE" || exit 1
else
    : > "$TMP_FILE" || exit 1
fi
printf '%s=%s\n' "$KEY" "$VALUE" >> "$TMP_FILE" || exit 1
mv "$TMP_FILE" "$SETTINGS_FILE" || exit 1
exit 0
