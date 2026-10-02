#!/bin/sh
# 点検表をまとめて作る。組ごとに別々に回せる（時間がかかるので）：
#   tests/audit.sh natural|dig|props|deep|kin|all   最後に tests/audit.sh table
cd "$(dirname "$0")/.."
D=tests/out/audit; mkdir -p $D
N=${N:-4}; S=${S:-600}
run() { rm -rf $D/$1; env BOT_OUT=$D/$1 PAR=${PAR:-2} "$@" > /dev/null; }
case "$1" in
 natural) STYLE=all,noweapon PAR=2 BOT_OUT=$D/natural node tests/sage.js $N $S > $D/natural.log 2>&1 ;;
 dig)     GIVE=shovel,bomb,bomb,timber,oldcoin STYLE=all PAR=2 BOT_OUT=$D/dig node tests/sage.js $N $S > $D/dig.log 2>&1 ;;
 props)   GIVE=kawa,fish,pot_fire,hidane,haguruma,tsubo START=4 STYLE=all,sneak PAR=2 BOT_OUT=$D/props node tests/sage.js $N $S > $D/props.log 2>&1 ;;
 terrain) GIVE=shovel,timber,timber,haguruma,bomb,bomb START=2 STYLE=all,sneak PAR=2 BOT_OUT=$D/terrain node tests/sage.js $N $S > $D/terrain.log 2>&1 ;;
 deep)    START=12 STYLE=all,pacifist PAR=2 BOT_OUT=$D/deep node tests/sage.js $((N/2)) $S > $D/deep.log 2>&1 ;;
 kin)     GIVE=oldcoin,pcoin,oldcoin,gem,potion START=1 STYLE=pacifist,sneak PAR=2 BOT_OUT=$D/kin node tests/sage.js $((N/2)) $S > $D/kin.log 2>&1 ;;
 all)     for b in natural dig props terrain deep kin; do sh $0 $b; done; sh $0 table ;;
 table|*) AUDIT_DIR=$D node tests/audit.js ;;
esac
