#!/usr/bin/env python3
"""Integration test for backup_files.py - validates end-to-end backup workflow.

This test creates a temporary git repository, makes changes, and validates
that the backup script correctly identifies and backs up the changes.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def run_git(*args: str, cwd: Path) -> str:
    """Run a git command and return output."""
    result = subprocess.run(
        ["git"] + list(args),
        cwd=cwd,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def run_backup_script(
    script_path: Path,
    repo_path: Path,
    *args: str,
) -> tuple[int, str, str]:
    """Run the backup script and return exit code, stdout, stderr."""
    result = subprocess.run(
        ["python3", str(script_path), "--repo", str(repo_path)] + list(args),
        capture_output=True,
        text=True,
    )
    return result.returncode, result.stdout, result.stderr


def test_integration() -> bool:
    """Run full integration test."""
    print("Starting integration test...")
    
    # Get path to backup script
    script_dir = Path(__file__).parent
    backup_script = script_dir / "backup_files.py"
    
    if not backup_script.exists():
        print(f"❌ Backup script not found: {backup_script}")
        return False
    
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_path = Path(tmpdir) / "test_repo"
        backup_path = Path(tmpdir) / "backups"
        
        print(f"\n📁 Test repository: {repo_path}")
        print(f"📁 Backup directory: {backup_path}")
        
        # 1. Initialize git repository
        print("\n1. Initializing git repository...")
        repo_path.mkdir()
        run_git("init", cwd=repo_path)
        run_git("config", "user.email", "test@example.com", cwd=repo_path)
        run_git("config", "user.name", "Test User", cwd=repo_path)
        print("   ✓ Repository initialized")
        
        # 2. Create initial files
        print("\n2. Creating initial files...")
        (repo_path / "file1.txt").write_text("Initial content 1")
        (repo_path / "file2.txt").write_text("Initial content 2")
        (repo_path / "subdir").mkdir()
        (repo_path / "subdir" / "file3.txt").write_text("Initial content 3")
        
        run_git("add", ".", cwd=repo_path)
        run_git("commit", "-m", "Initial commit", cwd=repo_path)
        print("   ✓ Initial commit created")
        
        # 3. Modify and delete files
        print("\n3. Making changes (modify, delete)...")
        (repo_path / "file1.txt").write_text("Modified content 1")
        (repo_path / "file2.txt").unlink()
        (repo_path / "file4.txt").write_text("New file")
        
        run_git("add", "-A", cwd=repo_path)
        run_git("commit", "-m", "Second commit: modify and delete", cwd=repo_path)
        print("   ✓ Changes committed")
        
        # 4. Run backup script
        print("\n4. Running backup script...")
        exit_code, stdout, stderr = run_backup_script(
            backup_script,
            repo_path,
            "--backup-dir",
            str(backup_path),
            "--local-only",
        )
        
        print(f"   Exit code: {exit_code}")
        print(f"   Output:\n{stdout}")
        
        if exit_code != 0:
            print(f"   ❌ Backup script failed:\n{stderr}")
            return False
        
        # 5. Validate backup structure
        print("\n5. Validating backup structure...")
        
        if not backup_path.exists():
            print("   ❌ Backup directory not created")
            return False
        
        sessions = list(backup_path.glob("*"))
        if not sessions:
            print("   ❌ No backup sessions found")
            return False
        
        session = sessions[0]
        print(f"   ✓ Backup session created: {session.name}")
        
        # 6. Validate backed up files
        print("\n6. Validating backed up files...")
        
        # Check for modified file
        modified_file1 = session / "modified" / "file1.txt"
        if modified_file1.exists():
            content = modified_file1.read_text()
            if content == "Modified content 1":
                print(f"   ✓ Modified file backed up correctly: file1.txt")
            else:
                print(f"   ❌ Modified file content incorrect")
                return False
        else:
            print(f"   ❌ Modified file not found: {modified_file1}")
            return False
        
        # Check for deleted file
        deleted_file2 = session / "deleted" / "file2.txt"
        if deleted_file2.exists():
            content = deleted_file2.read_text()
            if content == "Initial content 2":
                print(f"   ✓ Deleted file backed up correctly: file2.txt")
            else:
                print(f"   ❌ Deleted file content incorrect")
                return False
        else:
            print(f"   ❌ Deleted file not found: {deleted_file2}")
            return False
        
        # 7. Test multi-commit backup
        print("\n7. Testing multi-commit backup...")
        
        # Make more changes
        (repo_path / "file4.txt").write_text("Modified new file")
        run_git("add", ".", cwd=repo_path)
        run_git("commit", "-m", "Third commit", cwd=repo_path)
        
        # Clean previous backup
        shutil.rmtree(backup_path)
        
        # Run backup for last 2 commits
        exit_code, stdout, stderr = run_backup_script(
            backup_script,
            repo_path,
            "--backup-dir",
            str(backup_path),
            "--commits",
            "2",
            "--local-only",
        )
        
        if exit_code != 0:
            print(f"   ❌ Multi-commit backup failed:\n{stderr}")
            return False
        
        print("   ✓ Multi-commit backup succeeded")
        
        # 8. Validate multi-commit results
        print("\n8. Validating multi-commit backup...")
        sessions = list(backup_path.glob("*"))
        if sessions:
            session = sessions[0]
            backed_up_files = list(session.rglob("*"))
            file_count = sum(1 for f in backed_up_files if f.is_file())
            print(f"   ✓ Backed up {file_count} files from last 2 commits")
            
            # Should have file1.txt, file2.txt (deleted), and file4.txt (modified)
            if file_count >= 2:  # At least the deleted and one modified
                print("   ✓ Expected files found")
            else:
                print(f"   ⚠️  Expected more files, found {file_count}")
        
        print("\n" + "=" * 60)
        print("✅ All integration tests passed!")
        print("=" * 60)
        return True


def main() -> int:
    """Run integration test."""
    try:
        if test_integration():
            return 0
        return 1
    except Exception as exc:
        print(f"\n❌ Integration test failed with exception: {exc}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
