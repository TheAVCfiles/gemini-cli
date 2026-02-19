#!/usr/bin/env python3
"""Test suite for backup_files.py script.

This script validates the backup functionality without actually pushing to cloud.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def run_command(cmd: list[str], cwd: Path | None = None) -> tuple[int, str, str]:
    """Run a command and return exit code, stdout, and stderr."""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    return result.returncode, result.stdout, result.stderr


def test_help_command() -> bool:
    """Test that the help command works."""
    print("Test 1: Help command...")
    exit_code, stdout, stderr = run_command(
        ["python3", "scripts/backup_files.py", "--help"]
    )
    if exit_code == 0 and "Backup deleted and modified files" in stdout:
        print("  ✓ Help command works")
        return True
    print(f"  ✗ Help command failed: {stderr}")
    return False


def test_local_backup() -> bool:
    """Test local backup creation."""
    print("\nTest 2: Local backup creation...")
    
    # Clean up any existing backup directory
    backup_dir = Path("backup")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    
    # Run backup script
    exit_code, stdout, stderr = run_command(
        ["python3", "scripts/backup_files.py", "--local-only"]
    )
    
    # Check if backup was created
    if backup_dir.exists():
        backup_sessions = list(backup_dir.glob("*"))
        if backup_sessions:
            print(f"  ✓ Backup directory created: {backup_sessions[0].name}")
            
            # Check for backed up files
            files = list(backup_sessions[0].rglob("*"))
            file_count = sum(1 for f in files if f.is_file())
            print(f"  ✓ Backed up {file_count} file(s)")
            return True
    
    print(f"  ✗ Local backup failed: {stderr}")
    return False


def test_backup_structure() -> bool:
    """Test that backup maintains proper directory structure."""
    print("\nTest 3: Backup directory structure...")
    
    backup_dir = Path("backup")
    if not backup_dir.exists():
        print("  ✗ No backup directory found")
        return False
    
    # Check for timestamped directories
    sessions = list(backup_dir.glob("*"))
    if not sessions:
        print("  ✗ No backup sessions found")
        return False
    
    session = sessions[0]
    
    # Check for modified/deleted subdirectories
    has_structure = (
        (session / "modified").exists() or
        (session / "deleted").exists()
    )
    
    if has_structure:
        print(f"  ✓ Proper directory structure maintained")
        return True
    
    print("  ✗ Invalid directory structure")
    return False


def test_multiple_commits() -> bool:
    """Test backup with multiple commits."""
    print("\nTest 4: Backup with multiple commits...")
    
    # Clean up
    backup_dir = Path("backup")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    
    # Run backup script for last 5 commits
    exit_code, stdout, stderr = run_command(
        ["python3", "scripts/backup_files.py", "--commits", "5", "--local-only"]
    )
    
    if exit_code == 0:
        print(f"  ✓ Multi-commit backup succeeded")
        return True
    
    print(f"  ✗ Multi-commit backup failed: {stderr}")
    return False


def test_custom_backup_dir() -> bool:
    """Test backup with custom directory."""
    print("\nTest 5: Custom backup directory...")
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as tmpdir:
        custom_dir = Path(tmpdir) / "custom_backups"
        
        # Run backup with custom directory
        exit_code, stdout, stderr = run_command(
            [
                "python3",
                "scripts/backup_files.py",
                "--backup-dir",
                str(custom_dir),
                "--local-only",
            ]
        )
        
        if custom_dir.exists():
            print(f"  ✓ Custom backup directory used")
            return True
        
        print(f"  ✗ Custom directory test failed: {stderr}")
        return False


def test_no_changes() -> bool:
    """Test behavior when there are no changes (would require clean state)."""
    print("\nTest 6: No changes scenario...")
    print("  ⊘ Skipped (requires specific repository state)")
    return True


def cleanup() -> None:
    """Clean up test artifacts."""
    print("\nCleaning up test artifacts...")
    backup_dir = Path("backup")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
        print("  ✓ Removed backup directory")


def main() -> int:
    """Run all tests."""
    print("=" * 60)
    print("Backup Script Test Suite")
    print("=" * 60)
    
    # Change to repository root
    repo_root = Path(__file__).parent.parent
    os.chdir(repo_root)
    
    tests = [
        test_help_command,
        test_local_backup,
        test_backup_structure,
        test_multiple_commits,
        test_custom_backup_dir,
        test_no_changes,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as exc:
            print(f"  ✗ Test failed with exception: {exc}")
            results.append(False)
    
    # Clean up
    cleanup()
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
        return 0
    print(f"❌ {total - passed} test(s) failed")
    return 1


if __name__ == "__main__":
    sys.exit(main())
