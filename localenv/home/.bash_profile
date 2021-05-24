alias ll='ls -lahG'
alias lla='ls -la'
alias cl='clear'
alias his='history'
alias chrome="open -a \"Google Chrome\".app"
alias python=/usr/local/bin/python3
alias pip=/usr/local/bin/pip3

if  [[ -f "~/.git-completion.bash" ]]; then
	source ~/.git-completion.bash
fi

#Path Settings
export PATH=$PATH:${HOME}/Terraform/

export PATH="/usr/local/sbin:$PATH"