#!/bin/bash
# Quick Start Script for Git File Backup
#
# This script provides an interactive setup for the backup_files.py script
# Run this to quickly configure automated backups for your repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Git Backup Script - Quick Start Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository${NC}"
    echo "Please run this script from the root of your git repository"
    exit 1
fi

echo -e "${GREEN}✓ Git repository detected${NC}\n"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3.7 or higher"
    exit 1
fi

echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}\n"

# Check if backup script exists
if [ ! -f "scripts/backup_files.py" ]; then
    echo -e "${RED}Error: backup_files.py not found${NC}"
    echo "Please ensure scripts/backup_files.py exists in your repository"
    exit 1
fi

echo -e "${GREEN}✓ Backup script found${NC}\n"

# Make script executable
chmod +x scripts/backup_files.py
echo -e "${GREEN}✓ Made backup script executable${NC}\n"

echo -e "${YELLOW}Setup Options:${NC}\n"
echo "1. Test local backup (recommended first step)"
echo "2. Setup automated daily backups (cron)"
echo "3. Setup cloud backups with GitHub"
echo "4. View documentation"
echo "5. Run manual backup now"
echo "0. Exit"
echo ""
read -p "Choose an option (0-5): " choice

case $choice in
    1)
        echo -e "\n${BLUE}Running test backup...${NC}\n"
        python3 scripts/backup_files.py --local-only
        echo -e "\n${GREEN}Test complete!${NC}"
        echo "Check the 'backup/' directory to see your backed up files"
        ;;
    
    2)
        echo -e "\n${BLUE}Setting up daily automated backups...${NC}\n"
        
        # Get repository path
        REPO_PATH=$(pwd)
        
        # Create cron job
        CRON_CMD="0 2 * * * cd $REPO_PATH && $REPO_PATH/scripts/backup_files.py --cloud >> /var/log/git-backup.log 2>&1"
        
        echo "This will add the following cron job:"
        echo "$CRON_CMD"
        echo ""
        read -p "Add this cron job? (y/n): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
            echo -e "${GREEN}✓ Cron job added!${NC}"
            echo "Backups will run daily at 2:00 AM"
        else
            echo "Skipped cron setup"
        fi
        ;;
    
    3)
        echo -e "\n${BLUE}Setting up cloud backups...${NC}\n"
        echo "To enable cloud backups, you need a GitHub Personal Access Token"
        echo ""
        echo "Steps to create a token:"
        echo "1. Go to GitHub Settings → Developer settings → Personal access tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select 'repo' scope"
        echo "4. Generate and copy the token"
        echo ""
        read -p "Do you have a GitHub token? (y/n): " has_token
        
        if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
            read -sp "Enter your GitHub token: " token
            echo ""
            
            # Test cloud backup
            echo -e "\n${BLUE}Testing cloud backup...${NC}\n"
            python3 scripts/backup_files.py --cloud --token "$token"
            
            if [ $? -eq 0 ]; then
                echo -e "\n${GREEN}✓ Cloud backup successful!${NC}"
                echo ""
                read -p "Save token to environment? (y/n): " save_token
                
                if [ "$save_token" = "y" ] || [ "$save_token" = "Y" ]; then
                    echo "export GITHUB_TOKEN=$token" >> ~/.bashrc
                    echo -e "${GREEN}✓ Token saved to ~/.bashrc${NC}"
                    echo "Run 'source ~/.bashrc' to use it now"
                fi
            else
                echo -e "\n${RED}✗ Cloud backup failed${NC}"
            fi
        else
            echo "Please create a token first, then run this setup again"
        fi
        ;;
    
    4)
        echo -e "\n${BLUE}Opening documentation...${NC}\n"
        if [ -f "scripts/BACKUP_README.md" ]; then
            less scripts/BACKUP_README.md || cat scripts/BACKUP_README.md
        else
            echo "Documentation not found"
        fi
        ;;
    
    5)
        echo -e "\n${BLUE}Running manual backup...${NC}\n"
        read -p "Include cloud backup? (y/n): " include_cloud
        
        if [ "$include_cloud" = "y" ] || [ "$include_cloud" = "Y" ]; then
            python3 scripts/backup_files.py --cloud
        else
            python3 scripts/backup_files.py --local-only
        fi
        ;;
    
    0)
        echo "Exiting setup"
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Useful commands:"
echo "  • Manual backup:       ./scripts/backup_files.py --cloud"
echo "  • Local only:          ./scripts/backup_files.py --local-only"
echo "  • Last 5 commits:      ./scripts/backup_files.py --commits 5 --cloud"
echo "  • Help:                ./scripts/backup_files.py --help"
echo "  • Documentation:       cat scripts/BACKUP_README.md"
echo ""
