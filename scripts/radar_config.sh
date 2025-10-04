#!/bin/bash
#
# RADAR_MODE Configuration File
# Defines parameters for intraday lead/lag anomaly surveillance.
#
# Usage: source radar_config.sh

echo "Loading radar_config.sh..."

# --- 1. CORE OPERATIONAL SETTINGS ---
export RADAR_MODE="LIVE"
export RADAR_EXCHANGE="binanceusdm"
export RADAR_SYMBOL="ETH/USDT:USDT"
export RADAR_PAIR="BTC/USDT:USDT"

# --- 2. ALERT THRESHOLDS ---
export RADAR_ALERT_YELLOW="2.5"
export RADAR_ALERT_RED="4.0"
# export RADAR_ALERT_BLACK_SWAN="6.0"

# --- 3. INFRASTRUCTURE & LOGGING ---
mkdir -p "$HOME/radar_logs"
export RADAR_LOG_PATH="$HOME/radar_logs/anomaly_log.csv"

# --- 4. OPTIONAL NOTIFICATIONS ---
# export RADAR_SLACK_WEBHOOK="https://hooks.slack.com/services/XXXX/XXXX/XXXX"

echo "Radar config loaded. Mode=$RADAR_MODE, Symbol=$RADAR_SYMBOL"
# User-provided custom instructions
# https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a
