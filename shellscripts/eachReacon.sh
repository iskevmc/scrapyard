#!/bin/bash
#Created by Kevin McLeod
#Corrects allows for accurately reconing any SoulCycle Mac

#Naming Correction
hostName="$(scutil --get HostName)"
computerName="$(scutil --get ComputerName)"
localName="$(scutil --get LocalHostName)"
 
if [[  ${hostName} != ${computerName} ]]
 
   then echo "wrong name found, changing..."
   /usr/sbin/scutil --set ComputerName $hostName
   /usr/sbin/scutil --set LocalHostName $hostName
   echo "naming convention fixed..."
 
   else echo "No problem found...exiting..."
 
fi
 
#Variables
OSversion="$(sw_vers -productVersion | cut -d. -f2)"
CurrentUser="$(ls -l /dev/console | awk '{print $3}')"
Plist="$(${CurrentUser}/Library/Preferences/com.apple.desktop.plist)"

#Code excution
if [[ "${OSversion}" -ge "9" ]];
		then
			sqlite3 /Users/${CurrentUser}/Library/Application Support/Dock/desktoppicture.db << EOF
			UPDATE data SET value = "/Library/Desktop Pictures/SoulCycle_Retail_Wallpaper.jpg";
			EOF

			killall Dock

		then
			rm -rf /Users/${CurrentUser}/Library/Application\ Support/Dock/desktoppicture.db
			defaults write ${Plist} Background '{default = {ImageFilePath = "/Library/Desktop Pictures/SoulCycle_Retail_Wallpaper.jpg"; };}'
			
			killall Dock

fi 

exit 0