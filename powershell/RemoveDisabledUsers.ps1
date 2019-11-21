Import-Module ActiveDirectory

[string]$groupname = Read-Host 'What security group do you want to delete disabled users from?'
[string]$ouname = Read-Host 'What OU is this a part of?'




$file = "C:\users\da-john.doe\output.txt"


$group = "CN=" + $groupName + ",OU=" + $ouname + ",OU=Security,OU=zz-Groups,DC=Company,DC=local"

$AdMembers = Get-ADGroupMember -Identity $group
$AdMembers

$Users = $adMembers | %{Get-ADUser -Identity $_.distinguishedName -Properties Enabled | ?{$_.Enabled -eq $false}} | Select DistinguishedName,Enabled
$users

foreach ($user in $Users)
{  
	Write-Host "Processing: " $user

	if ($user.Enabled -eq $false)
	{

		"Deleted " +  $group + $user | Write-Host | Out-File $file
        	 Remove-ADGroupMember -Identity $group -Members $User.distinguishedName -Confirm:$false
	}
}


