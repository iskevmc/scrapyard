#!/bin/sh
loggedInUser=`/bin/ls -l /dev/console | /usr/bin/awk '{ print $3 }'`

accountType=`dscl . -read /Users/$loggedInUser | ﻿grep UniqueID | cut -c 11-`

if (( "$accountType" > 1000 )); then
	userRealname=`dscl . -read /Users/$loggedInUser | awk '/^dsAttrTypeNative:original_realname:/,/^dsAttrTypeNative:original_shell:/' | head -2 | tail -1 |cut -c 2-`
	userEmail=`dscl . -read  /Users/$loggedInUser | grep EMailAddress: | cut -c 15-`
	userPosition=`dscl . -read /Users/$loggedInUser | grep JobTitle: | cut -c 11-`
		if [[ -z $userPosition ]]; then
			userPosition=`dscl . -read /Users/$loggedInUser | awk '/^JobTitle:/,/^JPEGPhoto:/' | head -2 | tail -1  | cut -c 2-`
		fi
	userPhone=`dscl . -read /Users/$loggedInUser | grep -A 1 PhoneNumber: | tail -1 | cut -c 2-`
	userDepartment=`dscl . -read /Users/$loggedInUser | grep "Company:"  | cut -c 10-`
		if [[ -z $userDepartment ]]; then
			userDepartment=`dscl . -read /Users/$loggedInUser | awk '/^Company:/,/^CopyTimestamp:/' | head -2 | tail -1  | cut -c 2-`
		fi
			if [[ $userDepartment == *entland* ]]; then
				userDepartment=`dscl . -read /Users/$loggedInUser | grep "Department:" | cut -c 12-`
					if [[ -z $userDepartment ]]; then
						userDepartment=`dscl . -read /Users/$loggedInUser | awk '/^Department:/,/^EMailAddress:/' | head -2 | tail -1  | cut -c 2-`
					fi
			fi
	echo "Submitting information for network account $loggedInUser..."
	jamf recon -endUsername "$loggedInUser" -realname "$userRealname" -email "$userEmail" -position "$userPosition" -phone "$userPhone" -department "$userDepartment"
	
else
	echo "Submitting information for local account $loggedInUser..."
	userPosition="Local Account"
	jamf recon -endUsername "$loggedInUser" -position "$userPosition"
fi

# grab the current user and query AD for the email address
CurrentUser=`ls -l /dev/console | awk '{ print $3 }'`
email=`dscl "/Active Directory/All Domains/" -read /Users/$CurrentUser | grep EMailAddress | awk '{ print $2 }'`

#!/bin/sh
CurrentUser=`ls -l /dev/console | awk '{ print $3 }'`
if [ "($CurrentUser)" = "root" ]; then
   echo "Running as root which means no logged in user. Exit now" 1>&2
   echo "<result>NA</result>"
   exit 1
else
   email=`dscl "/Active Directory/All Domains/" -read /Users/$CurrentUser | grep EMailAddress | awk '{ print $2 }'`
   echo "<result>$email</result>"
fi
exit 0





Have a look at

Settings > LDAP Server Connections > Edit > Mappings

and check that Email Address is mapped correctly for your AD.  We actually don't want email address, so I map this to our Project field and then in

Settings > Inventory Options > Inventory Display Preferences > Location

I Custom Label the Email Address to Project.  Of course, this is automated and doesn't allow for changes.

-------------

However, if you still wish to script it, then you can shave down the commands to make them more efficient.  You say that your recon is taking ages, so if you have a lot of scripts trying to run for EA or otherwise, it is worth doing the following:

You dont need awk, just use stat instead to get the console user

stat -f%Su /dev/console

Directory Services can directly query any key.  Eg.

dscl -q localhost read /Active\ Directory/All\ Domains/Users/$CurrentUser EMailAddress

Use cut not awk!

dscl -q localhost read /Active\ Directory/All\ Domains/Users/$CurrentUser EMailAddress | cut -d " " -f 2

You could also add another check.  If user is root, then:

LastUser=`defaults read /Library/Preferences/com.apple.loginwindow lastUserName`

The more pipes you use and the more instances of awk and grep you are running the slower the scripts will run.  Although we have all got use to very powerful machines where it doesn't seem to matter how lazy we can be with these 'little' scripts, the more instances of these that you are trying to run at the same time, then the impact will actually start to show.

So something like:

#!/bin/bash

currentUser=`stat -f%Su /dev/console`

if [[ "$currentUser" == "root" ]]
then
       lastUser=`defaults read /Library/Preferences/com.apple.loginwindow lastUserName`

       if [[ "$lastUser" != "" ]]
       then
               eMail=`dscl -q localhost read /Active\ Directory/All\ Domains/Users/$lastUser EMailAddress | cut -d " " -f 2`
       else
               logger -t $0 message "Running as root which means no logged in user. Unable to update email address"
       fi
else
       eMail=`dscl -q localhost read /Active\ Directory/All\ Domains/Users/"$currentUser" EMailAddress | cut -d " " -f 2`
       jamf recon -email "$eMail"
fi

exit 0

Of course, this script is currently assuming that the user is an AD user and not a local user.  Ideally there should be a section to allow for this.

As Thomas mentioned, the jamf recon will allow you to populate these fields, but I am unaware (glad to hear if someone does know if this is possible) of a way to get the JSS to redo a query on a user, without logging into the web page, edit the location of the machine and hit the search button.

In an ideal world, the process would be something like:

jamf recon -endUsername sholden -query

Then you wouldn't need to be grabbing all of the different fields, ldap could do it for you.