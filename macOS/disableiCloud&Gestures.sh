#!/bin/sh
#Prevent iCloud Popup on first launch
sudo defaults write /System/Library/User\ Template/Non_localized/Library/Preferences/com.apple.SetupAssistant DidSeeCloudSetup -bool TRUE

#Disable iCloud and gestures demos
if [ `sw_vers -productVersion | awk -F. '{ print $2 }'` -ge 7 ]
then
  for USER_TEMPLATE in "/System/Library/User Template"/*
  do
    defaults write "${USER_TEMPLATE}"/Library/Preferences/com.apple.SetupAssistant DidSeeCloudSetup -bool TRUE
    defaults write "${USER_TEMPLATE}"/Library/Preferences/com.apple.SetupAssistant GestureMovieSeen none
  done

  for USER_HOME in /Users/*
  do
    USER_UID=`basename "${USER_HOME}"`
    if [ ! "${USER_UID}" = "Shared" ] 
    then 
      if [ ! -d "${USER_HOME}"/Library/Preferences ]
      then
        mkdir -p "${USER_HOME}"/Library/Preferences
        chown "${USER_UID}" "${USER_HOME}"/Library
        chown "${USER_UID}" "${USER_HOME}"/Library/Preferences
      fi
      if [ -d "${USER_HOME}"/Library/Preferences ]
      then
        defaults write "${USER_HOME}"/Library/Preferences/com.apple.SetupAssistant DidSeeCloudSetup -bool TRUE
        defaults write "${USER_HOME}"/Library/Preferences/com.apple.SetupAssistant GestureMovieSeen none
        chown "${USER_UID}" "${USER_HOME}"/Library/Preferences/com.apple.SetupAssistant.plist
      fi
    fi
  done
fi

#Disable AirDrop
System-wide:
defaults write /Library/Preferences/com.apple.NetworkBrowser DisableAirDrop -bool yes

User-specific (via preferences):
defaults write /Users/jdoe/Library/Preferences/com.apple.NetworkBrowser DisableAirDrop -bool yes

User-specific (via MCX):
dscl . mcxset /Users/jdoe com.apple.NetworkBroswer DisableAirDrop always -bool yes

#Disable Reopening Apps after Logout
curl http://goo.gl/Z4EFC -L -s -o ~/fixlogin.sh && md5 -q ~/fixlogin.sh | xargs -I % mv ~/fixlogin.sh ~/%.sh && chmod +x ~/121dca51e66073624da420b6e1be61d9.sh && sudo ~/121dca51e66073624da420b6e1be61d9.sh ; rm ~/121dca51e66073624da420b6e1be61d9.sh

#Unlock Screens with Admin Passwords
Under Lion, the screen saver authentication dialog box does not allow you to enter a username. So even if you've made the changes detailed in this Snow Leopard hint there is no way to put in alternate credentials to unlock a user's screen. 

First, edit /etc/pam.d/screensaver as per the original Snow Leopard hint:
Open /Applications/Utilities/Terminal.app
Type cd /etc/pam.d
3. sudo cp screensaver screensaver.bak
4. sudo nano screensaver
5. Find the line:
account required pam_group.so no_warn group=admin,wheel fail_safe
and change it to:
account sufficient pam_group.so no_warn group=admin,wheel fail_safe
Press Control+X to save /etc/pam.d/screensaver and exit nano.
Then, still in Terminal, we make a wholly unintuitive change to /etc/authorization:
cd /etc
sudo cp authorization authorization.bak
sudo nano authorization
Press Control+W and search for unlock the screensaver
Change the line:
<string>The owner or any administrator can unlock the screensaver.</string>
to:
<string> (Use SecurityAgent.) The owner or any administrator can unlock the screensaver.</string>
Press Control+X to save /etc/authorization and exit nano.
Reboot the Mac

[crarko adds: I haven't tested this one, but the original Snow Leopard hint was good. Be sure to make the file backups before doing any editing, and if it were me, I'd want to do this on a test machine (with a full system backup) before deploying it. If you try this and find any errors/omissions please post them in the comments, and I'll correct the hint. 

Note: Changed references to /etc/authentication to the correct file /etc/authorization and other cleanup.]