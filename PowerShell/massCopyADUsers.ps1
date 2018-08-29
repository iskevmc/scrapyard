Import-Module ActiveDirectory

$output = "C:\scripts\output\copyusers-" + [System.DateTime]::Today.ToString("yyyyMMdd") +".log"


[string]$FromSecurityGroup = Read-Host 'What security group do you want to copy from?'
[string]$ToSecurityGroup = Read-Host 'What security group do you want to copy to?'




foreach ($member in Get-ADGroupMember $fromSecurityGroup)
{
	try 
	{
		Add-ADGroupMember -Identity $ToSecurityGroup -Members $member 
		"Added $member to $ToSecurityGroup from $fromSecurityGroup" | out-file -append $output
	}
	catch [System.Exception]
	{
		Write-Host "Failed to add: " $member " because " $_.Exception.Message.ToString()
		$input = Read-Host "Do you want to continue? (Y/N)"
		
		if ($input -eq "y" -or $input -eq "Y")	
		{ continue; }
		else {exit;}
	}
}

Write-Host 'Your log file is located at ' $output