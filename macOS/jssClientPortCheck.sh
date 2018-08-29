#!/bin/bash 
#
####################################################################################################
#
# Copyright (c) 2013, JAMF Software, LLC.  All rights reserved.
#
#       This script was written by the JAMF Software Profesional Services Team 
#
#       THIS SOFTWARE IS PROVIDED BY JAMF SOFTWARE, LLC "AS IS" AND ANY
#       EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
#       WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
#       DISCLAIMED. IN NO EVENT SHALL JAMF SOFTWARE, LLC BE LIABLE FOR ANY
#       DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
#       (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
#       LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
#       ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
#       (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
#       SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
#####################################################################################################
#
# SUPPORT FOR THIS PROGRAM
#
#       This program is distributed "as is" by JAMF Software, Professional Services Team. For more
#       information or support for this script, please contact your JAMF Software Account Manager.
#
#####################################################################################################
#
# ABOUT THIS PROGRAM
#
# NAME
#	APNs_PDT.sh
#
# SYNOPSIS - How to use
#	
# Run this script locally on computers to test options for APNs connectivity. 
# It should work on Mac OS X or Linux.
# 
# DESCRIPTION
# 	
# This script runs checks each of the hostnames and ports needed for APNs.
# If the script cannot connect to a particular port, it will output errors.
#
# The information for the JSS can be hard coded into the script, or the script will prompt the user to enter it. 
# This URL field needs to be just the DNS name or localhost name; do not put in https:// or :8443
#
# Nota bene: If you enter a context name, it does not actually do any functional tests against that context. 
# It only fills in the context name to make the output URL path look pretty. I like pretty.
# 
# 
####################################################################################################
#
# HISTORY
#
#	Version: 1.0
#	- Created by Douglas Worley, Professional Services Engineer, JAMF Software on July 18 2013
#
#	Version 1.2
#	- Updated by Douglas Worley, Professional Services Engineer, JAMF Software on July 18 2013
#	-   Feature requests by John Kitzmiller, JAMF Software PSE: adding logic to test custom JSS ports 
#		and to support reporting on multi-context JSS instances.
#
#
####################################################################################################

# If you wish, hard code the information for your JSS server here, 
# If you do not enter these here, the script will prompt for them later.
jssUrl=""			# such as:	jss.company.com
jssContext="" 		# such as:	/context 		<-- This can be left blank
jssPort=""			# such as: 	8443



#These URLs likely won't change, but if they do you can do update them here:
url2195="gateway.sandbox.push.apple.com"
url2196="gateway.sandbox.push.apple.com"
url5223="35-courier.push.apple.com"
url443="albert.apple.com"

##### DO NOT MODIFY BELOW THIS LINE #####
#Clear the screen to make the results more visible
clear

# Title bar of the script
echo "                            "
echo "         JAMF Software - Professional Services"
echo " Apple Push Notificiation service - Ports Discovery Tool " && echo ""

# If the script does not have a hard coded JSS url above, prompt the user to do so:
until [ "$jssUrl" != "" ] && [ "$jssPort" != "" ]; do
	if [[ $jssUrl == "" ]] 
		then
		echo "Please enter the hostname of the server hosting your JSS:"
		echo "	Example: jss.company.com or jss.local"
		read jssUrl
	fi
	if [[ $jssContext == "" ]] 
		then
		echo "Is this a multi-context JSS? If so, enter your context name:"
		echo "	Example: /context"
		echo "	You can leave this blank"
		read jssContext
	fi
	if [[ $jssPort == "" ]] 
		then
		echo "Please enter the JAMF management port for your JSS:"
		echo "	Example: 8443"
		read jssPort
	fi
	
done

### Display JSS URL to verify it all looks right ###
#if jssPort is 443, echo w/o that variable. Nothing actually happens to the context, it's just pretty.
if [ "$jssPort" == "443" ]; 
	then
	echo "" && echo "JSS management URL is https://$jssUrl$jssContext"
else
	echo "" && echo "JSS management URL is https://$jssUrl$jssContext:$jssPort"
fi
	echo ""


### Do the port tests ###
#Port 2195
jssToAppleOut=`nc -z $url2195 2195`
if [[ "$jssToAppleOut" == *succeeded* ]]
	then
		echo "Success connecting to Apple on port 2195"
	else
		echo ""
		echo "	ALERT - Testing connectivity to $url2195 on port 2195 failed"
		echo "	... Traffic out from your JSS to APNs could be impaired"
fi

#Port 2196
jssToAppleFeedback=`nc -z $url2196 2196`
if [[ "$jssToAppleFeedback" == *succeeded* ]]
	then
		echo "Success connecting to Apple on port 2196"
	else
		echo ""
		echo "	ALERT - Testing connectivity to $url2196 on port 2196 failed"
		echo "	... Traffic from your JSS to check APNs feedback could be impaired"
fi

#Port 5223
deviceToApple=`nc -z $url5223 5223`
if [[ "$deviceToApple" == *succeeded* ]]
	then
		echo "Success connecting to Apple on port 5223"
	else
		echo ""
		echo "	ALERT - Testing connectivity to $url5223 on port 5223 failed"
		echo "	... Traffic from your managed devices to APNs could be impaired"
fi

#Port 443
deviceToAppleFallback=`nc -z $url443 443`
if [[ "$deviceToAppleFallback" == *succeeded* ]]
	then
		echo "Success connecting to Apple on port 443"
	else
		echo ""
		echo "	ALERT - Testing connectivity to $url443 on port 443 failed"
		echo "	... Traffic from your managed devices to Apple (fallback) could be impaired"
fi

#Port 8443
deviceToJss=`nc -z $jssUrl $jssPort`
if [[ "$deviceToJss" == *succeeded* ]]
	then
		echo "Success connecting to your JSS server at $jssUrl on port $jssPort"
	else
		echo ""
		echo "	ALERT - Testing connectivity to your JSS server at $jssUrl on port $jssPort failed"
		echo "	This does not necessarily mean your context at $jssContext is or is not configured properly, only that $jssUrl cannot be reached on $jssPort"
		echo "	... Traffic from your managed devices to your JSS could be impaired"
fi


### Consolidate the results ###
echo ""
if [[ "$jssToAppleOut" == *succeeded* ]] && [[ "$jssToAppleFeedback" == *succeeded* ]] && [[ "$deviceToApple" == *succeeded* ]] && [[ "$deviceToAppleFallback" == *succeeded* ]] && [[ "$deviceToJss" == *succeeded* ]]
	then
		echo "All ports look good! Get to work!"
	else
		echo "### ALERT - There are potential issues with the ports required for APNs ###"
fi