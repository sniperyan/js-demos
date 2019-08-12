#!/bin/bash
LOG="/tmp/xxx.log"

begin_at=$(date "+%Y-%m-%d %H:%M:%S")
echo "--BEGIN [${begin_at}] -----------------" >> ${LOG}
echo "publish xxx version: $1" >> ${LOG}

TARGET="/data/www/xxx/web/daily/$1"
mkdir -p ${TARGET}

cd /data/git/
rm -rf web
git clone ssh://git@192.168.0.1:10022/web.git
cd /data/git/web
git checkout daily/$1
git pull
\cp -r build/* ${TARGET}


end_at=$(date "+%Y-%m-%d %H:%M:%S")
echo "--END [${end_at}] -----------------" >> ${LOG}