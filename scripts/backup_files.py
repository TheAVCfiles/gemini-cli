#!/usr/bin/env python3
"""Automated backup script for deleted and updated files in Git repository.

This script performs both local and cloud backups of files that have been
deleted or modified in recent Git commits. It maintains file structure and
provides timestamped backups for versioning.

Features:
- Detects deleted/updated files from Git commit history
- Creates local timestamped backups in backup/ directory
- Pushes backups to _file-backups branch on GitHub
- Supports GitHub token authentication
- Command-line interface for automation and scheduling
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Literal


class GitBackupManager:
    """Manages Git-based backups of deleted and updated files."""

    def __init__(
        self,
        repo_path: Path,
        backup_dir: Path,
        backup_branch: str = "_file-backups",
        commits_back: int = 1,
    ):
        """Initialize the backup manager.

        Args:
            repo_path: Path to the Git repository root
            backup_dir: Path to the local backup directory
            backup_branch: Name of the remote backup branch
            commits_back: Number of commits to look back for changes
        """
        self.repo_path = repo_path.resolve()
        self.backup_dir = backup_dir.resolve()
        self.backup_branch = backup_branch
        self.commits_back = commits_back
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def run_git_command(self, *args: str, capture_output: bool = True) -> str:
        """Run a Git command and return its output.

        Args:
            *args: Git command arguments
            capture_output: Whether to capture and return output

        Returns:
            Command output if capture_output is True, else empty string

        Raises:
            subprocess.CalledProcessError: If Git command fails
        """
        cmd = ["git", "-C", str(self.repo_path)] + list(args)
        if capture_output:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
            )
            return result.stdout.strip()
        subprocess.run(cmd, check=True)
        return ""

    def get_changed_files(self) -> dict[str, list[str]]:
        """Detect deleted and modified files from recent commits.

        Returns:
            Dictionary with 'deleted' and 'modified' file lists
        """
        # Get the commit range to check
        if self.commits_back == 1:
            commit_range = "HEAD~1..HEAD"
        else:
            commit_range = f"HEAD~{self.commits_back}..HEAD"

        deleted_files = []
        modified_files = []

        try:
            # Get diff statistics for the commit range
            diff_output = self.run_git_command(
                "diff",
                "--name-status",
                commit_range,
            )

            for line in diff_output.split("\n"):
                if not line.strip():
                    continue

                parts = line.split(maxsplit=1)
                if len(parts) != 2:
                    continue

                status, filepath = parts

                # D = deleted, M = modified, A = added (we ignore added)
                if status == "D":
                    deleted_files.append(filepath)
                elif status in ("M", "R"):  # R = renamed
                    modified_files.append(filepath)

        except subprocess.CalledProcessError as exc:
            print(f"⚠️  Warning: Could not get diff: {exc}")

        return {
            "deleted": deleted_files,
            "modified": modified_files,
        }

    def backup_file_locally(
        self,
        filepath: str,
        file_type: Literal["deleted", "modified"],
    ) -> Path | None:
        """Create a local backup of a specific file.

        Args:
            filepath: Relative path to the file in the repository
            file_type: Type of change ('deleted' or 'modified')

        Returns:
            Path to the backed up file, or None if backup failed
        """
        # Create timestamped backup directory structure
        session_dir = self.backup_dir / self.timestamp / file_type
        backup_file_path = session_dir / filepath

        # Ensure parent directories exist
        backup_file_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            if file_type == "deleted":
                # For deleted files, get content from previous commit
                file_content = self.run_git_command(
                    "show",
                    f"HEAD~{self.commits_back}:{filepath}",
                )
                backup_file_path.write_text(file_content)
            else:
                # For modified files, copy current version
                source_file = self.repo_path / filepath
                if source_file.exists():
                    shutil.copy2(source_file, backup_file_path)
                else:
                    # File might have been renamed or deleted after modification
                    print(f"⚠️  Warning: {filepath} not found, skipping")
                    return None

            return backup_file_path

        except (subprocess.CalledProcessError, OSError) as exc:
            print(f"⚠️  Warning: Could not backup {filepath}: {exc}")
            return None

    def create_local_backups(self) -> tuple[int, int]:
        """Create local backups for all changed files.

        Returns:
            Tuple of (total_files_found, files_backed_up)
        """
        print(f"📁 Creating local backups in: {self.backup_dir / self.timestamp}")

        changed_files = self.get_changed_files()
        total_files = (
            len(changed_files["deleted"]) + len(changed_files["modified"])
        )

        if total_files == 0:
            print("ℹ️  No deleted or modified files found.")
            return 0, 0

        files_backed_up = 0

        # Backup deleted files
        for filepath in changed_files["deleted"]:
            if self.backup_file_locally(filepath, "deleted"):
                files_backed_up += 1
                print(f"  ✓ Backed up deleted: {filepath}")

        # Backup modified files
        for filepath in changed_files["modified"]:
            if self.backup_file_locally(filepath, "modified"):
                files_backed_up += 1
                print(f"  ✓ Backed up modified: {filepath}")

        return total_files, files_backed_up

    def push_to_backup_branch(self, github_token: str | None = None) -> bool:
        """Push backups to the remote backup branch.

        Args:
            github_token: GitHub personal access token for authentication

        Returns:
            True if successful, False otherwise
        """
        print(f"\n☁️  Pushing backups to branch: {self.backup_branch}")

        try:
            # Get current branch to restore later
            original_branch = self.run_git_command("rev-parse", "--abbrev-ref", "HEAD")

            # Check if backup branch exists remotely
            try:
                self.run_git_command("fetch", "origin", self.backup_branch)
                branch_exists = True
            except subprocess.CalledProcessError:
                branch_exists = False

            # Create or checkout backup branch
            if branch_exists:
                self.run_git_command("checkout", self.backup_branch)
                self.run_git_command("pull", "origin", self.backup_branch)
            else:
                # Create orphan branch (no history)
                self.run_git_command("checkout", "--orphan", self.backup_branch)
                # Remove all files from staging
                self.run_git_command("rm", "-rf", ".", capture_output=False)

            # Copy backup files to repository root
            backup_session_dir = self.backup_dir / self.timestamp
            if backup_session_dir.exists():
                # Copy the timestamped backup directory
                dest_dir = self.repo_path / "backups" / self.timestamp
                dest_dir.parent.mkdir(parents=True, exist_ok=True)
                shutil.copytree(backup_session_dir, dest_dir, dirs_exist_ok=True)

                # Stage the backup files
                self.run_git_command("add", str(dest_dir), capture_output=False)

                # Commit the backups
                commit_message = f"Backup session {self.timestamp}"
                self.run_git_command(
                    "commit",
                    "-m",
                    commit_message,
                    capture_output=False,
                )

                # Push to remote with authentication if token provided
                if github_token:
                    # Get remote URL
                    remote_url = self.run_git_command(
                        "config",
                        "--get",
                        "remote.origin.url",
                    )

                    # Modify URL to include token
                    if remote_url.startswith("https://"):
                        auth_url = remote_url.replace(
                            "https://",
                            f"https://{github_token}@",
                        )
                        self.run_git_command(
                            "push",
                            auth_url,
                            self.backup_branch,
                            capture_output=False,
                        )
                    else:
                        # For SSH URLs, just push normally
                        self.run_git_command(
                            "push",
                            "origin",
                            self.backup_branch,
                            capture_output=False,
                        )
                else:
                    # Push without token (requires existing authentication)
                    self.run_git_command(
                        "push",
                        "origin",
                        self.backup_branch,
                        capture_output=False,
                    )

                print(f"  ✓ Backups pushed to {self.backup_branch}")

            # Return to original branch
            self.run_git_command("checkout", original_branch, capture_output=False)

            return True

        except subprocess.CalledProcessError as exc:
            print(f"❌ Failed to push to backup branch: {exc}")
            # Try to return to original branch
            try:
                self.run_git_command("checkout", original_branch, capture_output=False)
            except Exception:  # noqa: S110
                pass
            return False


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Backup deleted and modified files from Git repository.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Backup files from last commit (local only)
  %(prog)s

  # Backup and push to cloud
  %(prog)s --cloud

  # Backup files from last 5 commits
  %(prog)s --commits 5

  # Use GitHub token for authentication
  %(prog)s --cloud --token YOUR_GITHUB_TOKEN

Environment Variables:
  GITHUB_TOKEN    GitHub personal access token for authentication
        """,
    )
    parser.add_argument(
        "--repo",
        type=Path,
        default=Path.cwd(),
        help="Path to Git repository (default: current directory)",
    )
    parser.add_argument(
        "--backup-dir",
        type=Path,
        default=Path.cwd() / "backup",
        help="Local backup directory (default: ./backup)",
    )
    parser.add_argument(
        "--commits",
        type=int,
        default=1,
        help="Number of commits to look back (default: 1)",
    )
    parser.add_argument(
        "--branch",
        type=str,
        default="_file-backups",
        help="Remote backup branch name (default: _file-backups)",
    )
    parser.add_argument(
        "--cloud",
        action="store_true",
        help="Push backups to cloud (GitHub branch)",
    )
    parser.add_argument(
        "--token",
        type=str,
        help="GitHub personal access token (or set GITHUB_TOKEN env var)",
    )
    parser.add_argument(
        "--local-only",
        action="store_true",
        help="Only create local backups, skip cloud push",
    )

    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Main entry point for the backup script."""
    args = parse_args(argv)

    # Get GitHub token from args or environment
    github_token = args.token or os.environ.get("GITHUB_TOKEN")

    # Validate repository path
    if not (args.repo / ".git").exists():
        print(f"❌ Not a Git repository: {args.repo}")
        return 1

    print("🔄 Starting backup process...")
    print(f"📍 Repository: {args.repo}")
    print(f"📅 Looking back: {args.commits} commit(s)")

    # Create backup manager
    manager = GitBackupManager(
        repo_path=args.repo,
        backup_dir=args.backup_dir,
        backup_branch=args.branch,
        commits_back=args.commits,
    )

    # Create local backups
    total_files, backed_up = manager.create_local_backups()

    if backed_up == 0:
        print("\n✅ No files needed backup.")
        return 0

    print(f"\n✅ Local backup complete: {backed_up}/{total_files} files backed up")

    # Push to cloud if requested
    if args.cloud and not args.local_only:
        if not github_token:
            print("\n⚠️  Warning: No GitHub token provided.")
            print("   Cloud push may fail if repository requires authentication.")
            print("   Set GITHUB_TOKEN environment variable or use --token option.")

        success = manager.push_to_backup_branch(github_token)
        if success:
            print("\n✅ Cloud backup complete!")
        else:
            print("\n⚠️  Cloud backup failed, but local backup is complete.")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
