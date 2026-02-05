# Deployment Troubleshooting Guide

## Common Issues and Solutions

### Issue: `git fetch` fails with exit code 1

This error occurs when the deployment script cannot fetch updates from GitHub. Here are the most common causes and solutions:

#### 1. Invalid or Expired GitHub Token

**Symptoms:**
- Error message mentions authentication failure
- `git fetch` exits with code 1

**Solution:**
1. Go to GitHub repository Settings → Secrets and variables → Actions
2. Check that `GH_DEPLOY_TOKEN` exists
3. Verify the token is not expired
4. Ensure the token has the correct permissions:
   - `repo` scope (full control of private repositories)
   - `workflow` scope (if using GitHub Actions)

**To create a new token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Update the `GH_DEPLOY_TOKEN` secret in your repository

#### 2. Token Lacks Repository Access

**Symptoms:**
- Authentication error even with valid token
- Error mentions "repository not found" or "access denied"

**Solution:**
- Ensure the token belongs to an account with access to `RaijiTRW/AI-Working-Seacrh`
- If using a personal access token, verify your account has collaborator access
- If using a GitHub App token, ensure it has repository permissions

#### 3. Network Connectivity Issues

**Symptoms:**
- Timeout errors
- Connection refused errors
- Intermittent failures

**Solution:**
1. Check VDS server can reach GitHub:
   ```powershell
   Test-NetConnection -ComputerName github.com -Port 443
   ```
2. Check firewall rules allow outbound HTTPS connections
3. Verify DNS resolution is working:
   ```powershell
   Resolve-DnsName github.com
   ```

#### 4. Git Credential Helper Conflicts

**Symptoms:**
- Inconsistent authentication errors
- Works manually but fails in script

**Solution:**
The deployment script now automatically disables credential helpers. If issues persist:
```powershell
# Check current git config
git config --local --list | findstr credential

# Manually reset credential helpers
git config --local --unset credential.helper
git config --local credential.helper ""
```

#### 5. Repository Configuration Issues

**Symptoms:**
- Git remote URL is incorrect
- Branch name mismatch

**Solution:**
```powershell
# Check remote URL
git remote get-url origin

# Should show: https://***@github.com/RaijiTRW/AI-Working-Seacrh.git

# Check current branch
git branch --show-current

# Should be: main
```

### Debug Mode

To enable detailed logging, modify the deployment script temporarily:

```powershell
# At the beginning of deploy-remote.ps1, add:
$VerbosePreference = "Continue"

# This will show all git commands and their output
```

### Manual Testing

To test git authentication manually on the VDS server:

```powershell
# Set the token
$env:GH_DEPLOY_TOKEN = "your-token-here"

# Test git fetch
git fetch origin main

# Check exit code
$LASTEXITCODE
```

### Checking GitHub Actions Logs

1. Go to Actions tab in GitHub repository
2. Click on the failed workflow run
3. Expand the "Deploy" step
4. Look for detailed error messages in the `[4/9] Pulling latest code...` section

### Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `fatal: could not read Username` | No credentials provided | Check `GH_DEPLOY_TOKEN` secret |
| `fatal: authentication failed` | Invalid token | Regenerate token with correct permissions |
| `fatal: repository not found` | Wrong repo URL or no access | Verify repository name and token permissions |
| `fatal: unable to access` | Network issue | Check firewall and DNS |
| `Connection timed out` | Network/firewall blocking | Allow outbound HTTPS to github.com |

### Quick Checklist Before Deployment

- [ ] `GH_DEPLOY_TOKEN` secret exists in repository settings
- [ ] Token has `repo` scope
- [ ] Token is not expired
- [ ] VDS server can reach GitHub (port 443)
- [ ] Repository name is correct: `RaijiTRW/AI-Working-Seacrh`
- [ ] Default branch is `main`

### Getting Help

If you're still experiencing issues after trying these solutions:

1. Collect the following information:
   - Full error message from GitHub Actions
   - Git version on VDS: `git --version`
   - PowerShell version: `$PSVersionTable`
   - Network test results: `Test-NetConnection github.com -Port 443`

2. Check GitHub Status: https://www.githubstatus.com/

3. Review the deployment script logs for any additional clues

### Script Improvements Made

The updated `deploy-remote.ps1` includes:

1. **Automatic credential helper disabling** - Prevents conflicts with Windows Credential Manager
2. **Better error messages** - More detailed debugging information
3. **Simplified fetch command** - Uses `git fetch origin main` instead of `--all --prune`
4. **Token validation** - Verifies token is not empty before attempting operations
5. **Cleanup step** - Restores git configuration after deployment
6. **Comprehensive error handling** - Catches and reports specific failure scenarios
