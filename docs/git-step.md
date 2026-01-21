On your local git CLI:

If you already have your github account authenticated:
Then, Remove saved credentials: `git credential-manager delete https://github.com`

`git config --global user.name "Yourfirstname lastname"`
`git config --global user.email "your-email@example.com"` (email should be email of your github account)

`git config --global credential.helper manager`

Try this command to trigger the login:
`git ls-remote https://github.com/your-username/any-repo.git`
NOTE: (This repo should be link to your any private repository)
After this: A window will pop up asking you to "Sign in with your browser."Click Authorize Git ecosystem. If you complete this no need to follow alternative steps.

If the popup does not appear, follow these steps:

Alternative: Authenticating with a Personal Access Token (PAT)

Step A: Generate a Token on GitHub
Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic).
Click Generate new token (classic).
Give it a name (e.g., "Windows-Git") and select the repo scope (and workflow if you need it).
Copy the token immediately (you won't see it again).

Step B: Use the Token in Git When you try to git push or git pull, and it asks for a password in the terminal:
Username: Enter your GitHub username.
Password: Paste the Personal Access Token you just generated (not your GitHub account password).

Check current config: `git config --list`
Check helper status: `git config credential.helper`
