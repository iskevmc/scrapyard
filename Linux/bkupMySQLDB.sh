#!/bin/bash
#This script was created in order to backup the New York MySQL Encode database, and store it on the IT_Admin share BACKUPS folder

### MySQL Server Login Info ###
MUSER="root"
MPASS="M@ch1niMa"
MYSQLDB="encode"
BAK="/var/lib/mysql/encode/backup/"


[ ! -d "$BAK" ] && mkdir -p "$BAK"

DBS="$($MYSQL -u $MUSER -h $MHOST -p$MPASS -Bse 'show databases')"
for db in $DBS
do
 FILE=$BAK/$db.$NOW-$(date +"%T").gz
 $MYSQLDUMP -u $MUSER -h $MHOST -p$MPASS $db | $GZIP -9 > $FILE
done

#Backup and compress db backup
mysqldump -u $MUSER -p $MYSQLDB > $BAK | gunzip > encodedbBackup.sql.gz

#Mount IT_Admin SMB share from AOANVMVA33
mount -t smbfs //mrmigrator:Ihave2move@aoanvmva33.hogarthww.prv/IT_Admin

#Copy backup to IT_Admin and trash older backups stored locally
mv -R $BAK/*.gz /mnt/IT_Admin/BACKUPS/Encode_DB_Backups/
umount /mnt/IT_Admin | rm -rf /var/lib/mysql/encode/backup/*
