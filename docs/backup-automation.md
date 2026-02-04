# Git File Backup Automation

## Overview

The Git Backup system provides automated backup capabilities for deleted and updated files in your repository, offering both local and cloud-based backup solutions.

## Quick Start

```bash
# 1. Run interactive setup
./scripts/setup_backup.sh

# 2. Or manually test backup
./scripts/backup_files.py --local-only

# 3. Enable cloud backups
./scripts/backup_files.py --cloud --token YOUR_GITHUB_TOKEN
```

## Features

### Local Backups

- **Timestamped Sessions**: Each backup session creates a unique timestamped directory
- **File Structure Preservation**: Maintains the original directory structure
- **Change Detection**: Automatically identifies deleted and modified files from Git history
- **No External Dependencies**: Uses only Python standard library and Git

### Cloud Backups

- **Dedicated Branch**: Stores backups in a separate `_file-backups` branch
- **GitHub Integration**: Seamless push to your repository
- **Token Authentication**: Secure authentication using GitHub Personal Access Tokens
- **Isolation**: Cloud backups don't interfere with your working branches

### Automation

- **Command-Line Interface**: Fully scriptable for automation
- **Cron Support**: Easy integration with cron for scheduled backups
- **Git Hooks**: Can be integrated as post-commit hooks
- **CI/CD Ready**: Works with GitHub Actions and other CI/CD platforms

## Architecture

### Backup Directory Structure

```
backup/
├── 20260204_143022/          # Timestamp: YYYYMMDD_HHMMSS
│   ├── deleted/              # Files that were deleted
│   │   └── path/to/deleted_file.txt
│   └── modified/             # Files that were modified
│       └── path/to/modified_file.js
└── 20260204_150030/          # Next backup session
    └── ...
```

### Cloud Backup Branch Structure

```
_file-backups branch:
└── backups/
    ├── 20260204_143022/
    │   ├── deleted/
    │   └── modified/
    └── 20260204_150030/
        └── ...
```

## Components

### 1. Main Backup Script (`backup_files.py`)

The core script that handles:

- Git diff analysis to detect changes
- File retrieval from Git history
- Local backup creation
- Cloud push to backup branch

**Usage:**

```bash
./scripts/backup_files.py [OPTIONS]

Options:
  --repo PATH           Path to Git repository
  --backup-dir PATH     Local backup directory
  --commits N           Number of commits to look back
  --branch NAME         Remote backup branch name
  --cloud               Enable cloud backups
  --token TOKEN         GitHub personal access token
  --local-only          Skip cloud push
```

### 2. Interactive Setup (`setup_backup.sh`)

Guided setup wizard that helps configure:

- Local backup testing
- Cron job creation
- GitHub token configuration
- Documentation access

**Usage:**

```bash
./scripts/setup_backup.sh
```

### 3. Test Suite

- `test_backup_script.py`: Unit tests for backup functionality
- `test_backup_integration.py`: End-to-end integration tests

**Usage:**

```bash
# Run unit tests
./scripts/test_backup_script.py

# Run integration tests
./scripts/test_backup_integration.py
```

## Use Cases

### 1. Accidental Deletion Recovery

When files are accidentally deleted:

```bash
# Backup shows deleted files from last commit
./scripts/backup_files.py --local-only

# Find deleted file in: backup/TIMESTAMP/deleted/path/to/file
```

### 2. Code Review Snapshots

Before major refactoring:

```bash
# Backup current state
./scripts/backup_files.py --cloud

# Make changes, then compare with backups if needed
```

### 3. Continuous Data Protection

Automated protection with cron:

```bash
# Daily backups at 2 AM
0 2 * * * cd /path/to/repo && ./scripts/backup_files.py --cloud
```

### 4. Pre-Deployment Safety Net

In CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Backup before deployment
  run: ./scripts/backup_files.py --cloud --commits 10
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration

### GitHub Token Setup

1. **Generate Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create new token with `repo` scope

2. **Configure Token**:

   ```bash
   # Option 1: Environment variable (recommended)
   export GITHUB_TOKEN=your_token_here

   # Option 2: Add to shell profile
   echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc

   # Option 3: Pass as argument
   ./scripts/backup_files.py --cloud --token your_token_here
   ```

### Cron Configuration

See `scripts/backup_cron_examples.txt` for cron job templates:

```bash
# Daily backup
0 2 * * * cd /path/to/repo && ./scripts/backup_files.py --cloud

# Every 6 hours
0 */6 * * * cd /path/to/repo && ./scripts/backup_files.py --cloud

# Weekly comprehensive backup
0 0 * * 0 cd /path/to/repo && ./scripts/backup_files.py --commits 50 --cloud
```

## Security Considerations

### Token Security

- ✅ Use environment variables for tokens
- ✅ Never commit tokens to repository
- ✅ Rotate tokens periodically
- ✅ Use minimum required permissions (repo scope only)

### Backup Data

- ✅ Local `backup/` directory is in `.gitignore`
- ✅ Cloud backups are on isolated branch
- ✅ Consider encrypting sensitive backup data
- ⚠️ Be aware backups may contain sensitive information

## Troubleshooting

### Common Issues

**Issue**: "Not a Git repository"

- **Solution**: Run from repository root or use `--repo` option

**Issue**: "Cloud push failed"

- **Solution**: Check GitHub token has `repo` scope and is valid

**Issue**: "Permission denied"

- **Solution**: Make script executable: `chmod +x scripts/backup_files.py`

**Issue**: "No files to backup"

- **Solution**: This is normal if no files were modified/deleted in recent commits

## Performance

- **Small Changes**: Backup completes in seconds
- **Large Files**: Time increases with file size
- **Many Commits**: Use `--commits` option judiciously (default: 1)
- **Network**: Cloud push time depends on backup size and network speed

## Limitations

- Only backs up tracked files (not untracked or .gitignore'd files)
- Requires Git history to retrieve deleted files
- Cloud push requires network connectivity
- Large binary files may slow down backups

## Best Practices

1. **Test First**: Always test with `--local-only` before enabling cloud
2. **Regular Backups**: Set up automated daily backups
3. **Verify Recovery**: Periodically test restoring from backups
4. **Monitor Disk Space**: Clean old local backups if space is limited
5. **Retention Policy**: Decide how long to keep backups

## Documentation

- **Main Documentation**: `scripts/BACKUP_README.md`
- **Cron Examples**: `scripts/backup_cron_examples.txt`
- **This Overview**: `docs/backup-automation.md`

## Support

For issues or questions:

1. Check the documentation in `scripts/BACKUP_README.md`
2. Review example configurations in `scripts/backup_cron_examples.txt`
3. Run tests to verify installation: `./scripts/test_backup_script.py`

## Contributing

When contributing to the backup system:

- Follow existing Python code style
- Add tests for new features
- Update documentation
- Test both local and cloud backup scenarios

## License

This backup system is part of the gemini-cli project and follows the same license.
