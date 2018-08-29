#########################################################################################################
# COMMENT : This script creates new Active Directory users, including different kind of properties, based
#           on an staff_import.csv.
#########################################################################################################

# ERROR REPORTING ALL
Set-StrictMode -Version latest

#----------------------------------------------------------
# LOAD ASSEMBLIES AND MODULES
#----------------------------------------------------------
Try { Import-Module ActiveDirectory -ErrorAction Stop }
Catch { Write-Host "[ERROR]`t ActiveDirectory Module couldn't be loaded. Script will stop!" Exit 1 }

#--------------------------------------------------------------------------
#STATIC VARIABLES
#--------------------------------------------------------------------------
$path     = Split-Path -parent $MyInvocation.MyCommand.Definition
$newpath  = $path + "\staff_import.csv"
$log      = $path + "\Import-CSV.log"
$date     = Get-Date
$addn     = (Get-ADDomain).DistinguishedName #DC=corp,DC=company,DC=com
$dnsroot  = (Get-ADDomain).DNSRoot #corp.company.com
$i        = 1

#--------------------------------------------------------------------------
#START FUNCTIONS
#--------------------------------------------------------------------------
Function Start-Commands
{ Create-Users }

Function Create-Users
{ "Processing started (on " + $date + "): " | Out-File $log -append
  "--------------------------------------------" | Out-File $log -append
  Import-CSV $newpath | ForEach-Object {
    If (($_.Implement.ToLower()) -eq "yes")
      { If (($_.GivenName -eq "") -Or ($_.LastName -eq ""))
          { Write-Host "[ERROR]`t Please provide valid GivenName, LastName. Processing skipped for line $($i)`r`n" | Out-File $log -append }
          
          Else
            { # Set location
              $location = $_.TargetOU
              # Set the Enabled and PasswordNeverExpires properties
              If (($_.Enabled.ToLower()) -eq "true") { $enabled = $True } Else { $enabled = $False }
              If (($_.PasswordNeverExpires.ToLower()) -eq "true") { $expires = $True } Else { $expires = $False }

              # A check for the country, because those were full names and need to be land codes in order for AD to accept them
              If ($_.Country -eq "United States") { $_.Country = "US" }
         
              # Create samAccountName according to data from csv
              $sam = $_.samAccountName
              Try { $exists = Get-ADUser -LDAPFilter "(samAccountName=$sam)" }
                Catch { }
                  If(!$exists)
                    { # Set all variables according to the table names in the Excel CSV. The names can differ in every project, but 
                      # if the names change, make sure to change it below as well.
                      $setpass = ConvertTo-SecureString -AsPlainText $_.Password -force

                      Try { Write-Host "[INFO]`t Creating user : $($sam)"
                            "[INFO]`t Creating user : $($sam)" | Out-File $log -append
                            New-ADUser $sam -GivenName $_.GivenName -Surname $_.LastName -DisplayName ($_.GivenName + " " + $_.LastName) -Office $_.OfficeName -Description $_.Description -EmailAddress $_.Mail -StreetAddress $_.StreetAddress -City $_.City -State $_.State -PostalCode $_.PostalCode -Country $_.Country -UserPrincipalName ($sam + "@" + $dnsroot) -Company $_.Company -Department $_.Department -Title $_.Title -OfficePhone $_.Phone -AccountPassword $setpass -Enabled $enabled -PasswordNeverExpires $expires 
                            Write-Host "[INFO]`t Created new user : $($sam)" | Out-File $log -append
                 
                            $dn = (Get-ADUser $sam).DistinguishedName
                            # Move the user to the OU ($location) you set above. If you don't
                            If ([adsi]::Exists("LDAP://$($location)"))
                              { Move-ADObject -Identity $dn -TargetPath $location
                                Write-Host "[INFO]`t User $($sam) moved to target OU : $($location)" | Out-File $log -append }

                              Else { Write-Host "[ERROR]`t Targeted OU couldn't be found. Newly created user wasn't moved!" | Out-File $log -append } 

                            # Rename the object to a good looking name otherwise you see ugly shortened sAMAccountNames as a name in AD. This
                            # can't be set right away as sAMAccountName due to the 20 character restriction.
                            $newdn = (Get-ADUser $sam).DistinguishedName
                            Rename-ADObject -Identity $newdn -NewName ($_.GivenName + " " + $_.LastName)
                            Write-Host "[INFO]`t Renamed $($sam) to $($_.GivenName) $($_.LastName)`r`n" | Out-File $log -append }
                      
                      Catch { Write-Host "[ERROR]`t FUCK, something went wrong: $($_.Exception.Message)`r`n" } }
                    
                    Else { Write-Host "[SKIP]`t User $($sam) ($($_.GivenName) $($_.LastName)) already exists or returned an error!`r`n" | Out-File $log -append } } }
      
      Else { Write-Host "[SKIP]`t User ($($_.GivenName) $($_.LastName)) will be skipped for processing!`r`n"| Out-File $log -append }

      $i++ }

  "--------------------------------------------" + "`r`n" | Out-File $log -append }

Write-Host "STARTED SCRIPT`r`n"
Start-Commands
Write-Host "STOPPED SCRIPT"