#!/bin/sh
printf 'Content-Type: text/html; charset=utf-8\r\n'
printf 'Cache-Control: no-store\r\n\r\n'
cat "/mnt/us/extensions/InkDeck/filebrowser/home.page"
