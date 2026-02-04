# Backup Script Documentation

## Overview

The `backup_files.py` script automates both local and cloud backups of deleted and updated files in your Git repository. It provides a lightweight, resilient solution for preserving critical data.

## Features

- **Automatic Detection**: Identifies deleted and modified files from Git commit history
- **Local Backups**: Creates timestamped backups in a `backup/` directory with preserved file structure
- **Cloud Backups**: Pushes backups to a dedicated `_file-backups` branch on GitHub
- **Authentication**: Supports GitHub token-based authentication
- **Command-Line Interface**: Fully automated execution without manual input
- **Scheduling Support**: Can be integrated with cron or other schedulers

## Installation

The script requires Python 3.7+ and Git. No additional dependencies are needed.

```bash
# Make the script executable
chmod +x scripts/backup_files.py
```

## Usage

### Basic Usage

```bash
# Backup files from the last commit (local only)
./scripts/backup_files.py

# Backup and push to cloud
./scripts/backup_files.py --cloud

# Backup files from the last 5 commits
./scripts/backup_files.py --commits 5
```

### Command-Line Options

```
Options:
  --repo PATH           Path to Git repository (default: current directory)
  --backup-dir PATH     Local backup directory (default: ./backup)
  --commits N           Number of commits to look back (default: 1)
  --branch NAME         Remote backup branch name (default: _file-backups)
  --cloud               Push backups to cloud (GitHub branch)
  --token TOKEN         GitHub personal access token
  --local-only          Only create local backups, skip cloud push
  -h, --help            Show help message
```

### Examples

#### 1. Local Backup Only

```bash
./scripts/backup_files.py
```

This creates a timestamped backup of deleted/modified files in `./backup/YYYYMMDD_HHMMSS/`.

#### 2. Local and Cloud Backup

```bash
./scripts/backup_files.py --cloud --token YOUR_GITHUB_TOKEN
```

Creates local backup and pushes to the `_file-backups` branch.

#### 3. Backup Multiple Commits

```bash
./scripts/backup_files.py --commits 10 --cloud
```

Backs up all deleted/modified files from the last 10 commits.

#### 4. Custom Backup Location

```bash
./scripts/backup_files.py --backup-dir /path/to/backups --cloud
```

## Authentication

### GitHub Token Setup

For cloud backups, you need a GitHub Personal Access Token (PAT):

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
4. Generate and copy the token

### Using the Token

**Option 1: Environment Variable (Recommended)**

```bash
export GITHUB_TOKEN=your_token_here
./scripts/backup_files.py --cloud
```

**Option 2: Command-Line Argument**

```bash
./scripts/backup_files.py --cloud --token your_token_here
```

**Option 3: Add to Shell Profile**

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export GITHUB_TOKEN=your_token_here
```

## Automation with Cron

### Setup Automated Backups

1. Edit your crontab:

```bash
crontab -e
```

2. Add a cron job (examples):

```cron
# Backup every day at 2 AM
0 2 * * * cd /path/to/repo && /path/to/repo/scripts/backup_files.py --cloud >> /var/log/git-backup.log 2>&1

# Backup every 6 hours
0 */6 * * * cd /path/to/repo && /path/to/repo/scripts/backup_files.py --cloud

# Backup after every commit (using git hooks would be better)
*/5 * * * * cd /path/to/repo && /path/to/repo/scripts/backup_files.py --cloud
```

### Using Git Hooks (Alternative)

Create a post-commit hook to automatically backup after each commit:

```bash
# Create the hook file
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Automatic backup after commit
./scripts/backup_files.py --cloud --local-only > /dev/null 2>&1 &
EOF

# Make it executable
chmod +x .git/hooks/post-commit
```

## Backup Structure

### Local Backup Structure

```
backup/
├── 20260204_143022/          # Timestamp: YYYYMMDD_HHMMSS
│   ├── deleted/              # Deleted files
│   │   └── path/to/file.txt
│   └── modified/             # Modified files
│       └── path/to/file.js
└── 20260204_150030/
    └── ...
```

### Cloud Backup Structure

On the `_file-backups` branch:

```
backups/
├── 20260204_143022/
│   ├── deleted/
│   └── modified/
└── 20260204_150030/
    └── ...
```

## How It Works

1. **Detection**: The script uses `git diff --name-status` to identify changed files
2. **Retrieval**: 
   - For deleted files: Retrieves content from previous commit using `git show`
   - For modified files: Copies current file content
3. **Local Backup**: Saves files to timestamped directory maintaining original structure
4. **Cloud Backup** (if enabled):
   - Switches to `_file-backups` branch (creates if doesn't exist)
   - Copies backup files to branch
   - Commits and pushes to remote
   - Returns to original branch

## Troubleshooting

### "Not a Git repository" Error

Ensure you're running the script from within a Git repository or use `--repo` option.

### Cloud Push Fails

- Check that your GitHub token has `repo` scope
- Verify network connectivity
- Ensure remote repository URL is correct: `git remote -v`
- Try SSH authentication instead of HTTPS

### Permission Denied

Make sure the script is executable:

```bash
chmod +x scripts/backup_files.py
```

### Large Repository Performance

For repositories with many commits, use `--commits` judiciously:

```bash
# Limit to recent commits
./scripts/backup_files.py --commits 1
```

## Security Considerations

1. **Token Security**:
   - Never commit tokens to repository
   - Use environment variables or secure credential managers
   - Rotate tokens periodically

2. **Backup Data**:
   - Local `backup/` directory is in `.gitignore`
   - Cloud backups are on a separate branch
   - Consider encrypting sensitive backup data

3. **Access Control**:
   - Limit token permissions to minimum required (`repo` scope)
   - Use different tokens for different purposes

## Integration with CI/CD

### GitHub Actions Example

Create `.github/workflows/backup.yml`:

```yaml
name: Automated Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history
          
      - name: Run backup script
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          python3 scripts/backup_files.py --cloud --commits 5
```

## Dependencies

- **Python**: 3.7 or higher (uses standard library only)
- **Git**: Any recent version
- **GitHub**: For cloud backups (optional)

## Limitations

- Does not backup untracked files
- Does not backup files in `.gitignore`
- Requires Git history to retrieve deleted files
- Large files may increase backup time

## Best Practices

1. **Regular Backups**: Schedule backups at regular intervals
2. **Test Recovery**: Periodically verify you can restore from backups
3. **Monitor Disk Space**: Local backups accumulate over time
4. **Clean Old Backups**: Implement retention policy for old backups
5. **Separate Backup Repo**: For critical projects, consider pushing to separate repository

## License

This script is part of the gemini-cli project and follows the same license.
