# Git Backup Quick Start

This guide will get you started with automated Git file backups in 5 minutes.

## Step 1: Test Local Backup

Run a test backup to ensure everything works:

```bash
./scripts/backup_files.py --local-only
```

This will:

- Detect any deleted/modified files from your last commit
- Create a timestamped backup in `./backup/`
- Show you what was backed up

## Step 2: Check Your Backup

```bash
# View backup directory structure
ls -R backup/

# Or find specific files
find backup/ -type f
```

## Step 3: Enable Cloud Backups (Optional)

To push backups to GitHub:

1. **Create a GitHub token**:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select `repo` scope
   - Copy the token

2. **Set the token**:

   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

3. **Run cloud backup**:
   ```bash
   ./scripts/backup_files.py --cloud
   ```

Your backups will be pushed to the `_file-backups` branch.

## Step 4: Automate (Optional)

### Option A: Use Setup Script

```bash
./scripts/setup_backup.sh
```

The wizard will guide you through:

- Testing backups
- Setting up cron jobs
- Configuring GitHub tokens

### Option B: Manual Cron Setup

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line (daily at 2 AM):
0 2 * * * cd /path/to/your/repo && /path/to/your/repo/scripts/backup_files.py --cloud
```

## Common Commands

```bash
# Help and documentation
./scripts/backup_files.py --help

# Backup last 5 commits
./scripts/backup_files.py --commits 5 --local-only

# Backup and push to cloud
./scripts/backup_files.py --cloud

# Use custom backup directory
./scripts/backup_files.py --backup-dir /path/to/backups
```

## What Gets Backed Up?

- ✅ **Deleted files**: Retrieved from Git history
- ✅ **Modified files**: Current version backed up
- ❌ **Untracked files**: Not backed up
- ❌ **Ignored files**: Not backed up

## Need More Help?

- **Full Documentation**: `scripts/BACKUP_README.md`
- **Cron Examples**: `scripts/backup_cron_examples.txt`
- **Overview**: `docs/backup-automation.md`
- **Run Tests**: `./scripts/test_backup_script.py`

## Troubleshooting

| Problem                     | Solution                                     |
| --------------------------- | -------------------------------------------- |
| "Not a Git repository"      | Run from repository root                     |
| "Permission denied"         | Run: `chmod +x scripts/backup_files.py`      |
| "Cloud push failed"         | Check your GitHub token has `repo` scope     |
| "No files to backup"        | Normal if no files changed in recent commits |
| Python not found            | Install Python 3.7+                          |
| Can't find backup directory | Look in `./backup/YYYYMMDD_HHMMSS/`          |

## Security Notes

- ⚠️ Never commit your GitHub token to the repository
- ✅ Use environment variables for tokens
- ✅ The `backup/` directory is in `.gitignore`
- ✅ Cloud backups go to a separate branch

## Support

If you encounter issues:

1. Run the test suite: `./scripts/test_backup_script.py`
2. Check the documentation
3. Verify Python 3.7+ and Git are installed

---

**That's it!** You now have automated Git backups protecting your work.
