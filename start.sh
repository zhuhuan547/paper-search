#!/usr/bin/env bash
# 一键启动前后端（队列消费者由 Claude 会话的 /start 命令负责）
# 用法：bash start.sh
set -e
cd "$(dirname "$0")"

echo "[start] 启动后端 (EXTERNAL_CONSUMER=1) ..."
EXTERNAL_CONSUMER=1 npm --prefix backend start &
BACKEND_PID=$!

echo "[start] 启动前端 ..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo ""
echo "[start] 后端 http://localhost:3001  (PID $BACKEND_PID)"
echo "[start] 前端 http://localhost:5173  (PID $FRONTEND_PID)"
echo "[start] 队列消费者请在 Claude 会话中运行 /start"
echo ""

# Ctrl+C 时同时关掉前后端
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
