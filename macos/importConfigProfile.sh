#!/bin/sh
#Import user configuration profiles and auto populate username upon login
#Created by Kevin McLeod

userName=""
if [ "$3" != "" ] && [ "$userName" == "" ]; 
	then userName=$3
fi

if [ "$userName" == "" ]; 
	then profiles -I -F "/var/jss_nyc_config_profiles/NYC_General_System_Standards.mobileconfig"
	else echo "No profile/profiles were found..."
fi

exit 0