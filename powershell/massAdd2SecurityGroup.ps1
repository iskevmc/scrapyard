##Description - Adds all users from a specific OU to an AD Security Group

Import-Module ActiveDirectory

#Apply all Devs to Dev NAS Group
Get-ADUser -SearchBase 'OU=Developers,OU=z-UserAccounts,DC=Company,DC=local' -Filter * | ForEach-Object { Add-ADGroupMember -Identity "NAS-Dev-Read-DevVault" -Members $_.SamAccountName }







