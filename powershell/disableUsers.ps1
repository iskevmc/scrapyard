##Description - Disable all users accounts in a specified OU

Import-Module activedirectory

Get-ADUser -Filter 'Name -like "*"' -SearchBase "OU=zz-Disabled Users,DC=company,DC=local" | Disable-ADAccount




