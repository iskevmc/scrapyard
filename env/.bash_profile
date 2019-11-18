alias ll='ls -lahG'
alias chrome="open -a \"Google Chrome\".app"

if  [[ -f "~/.git-completion.bash" ]]; then
	source ~/.git-completion.bash
fi

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/sk8bit/Desktop/google-cloud-sdk/path.bash.inc' ]; then source '/Users/sk8bit/Desktop/google-cloud-sdk/path.bash.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/sk8bit/Desktop/google-cloud-sdk/completion.bash.inc' ]; then source '/Users/sk8bit/Desktop/google-cloud-sdk/completion.bash.inc'; fi

test -e "${HOME}/.iterm2_shell_integration.bash" && source "${HOME}/.iterm2_shell_integration.bash"

#Path Settings
export PATH=$PATH:/Users/username/Terraform/

# Setting PATH for Python 2.7
# The original version is saved in .bash_profile.pysave
export PATH="/Library/Frameworks/Python.framework/Versions/2.7/bin:${PATH}"

# Setting PATH for Python 3.5
# The original version is saved in .bash_profile.pysave
export PATH="/Library/Frameworks/Python.framework/Versions/3.5/bin:${PATH}"

# Setting PATH for Python 3.6
# The original version is saved in .bash_profile.pysave
export PATH="/Library/Frameworks/Python.framework/Versions/3.6/bin:${PATH}"

export PATH="/usr/local/sbin:$PATH"
