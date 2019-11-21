#########################################################################################################
# COMMENT : This script exports a csv listing all Active Directory Company Users
#########################################################################################################

$userlist = Get-ADUser -Filter * -Properties * | Select-Object -Property Name,SamAccountName,Title,Department,Enabled,MemberOf | Sort-Object -Property Name

$userlist | Out-File c:\company_audit.csv