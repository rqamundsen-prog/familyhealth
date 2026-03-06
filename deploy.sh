#!/bin/bash
# 家健 - 一键部署脚本
# 用法: ./deploy.sh [--preview]
# 需要设置环境变量 VERCEL_TOKEN 或在 ~/.zshrc 中配置

VERCEL_TOKEN="${VERCEL_TOKEN:-$FAMILYHEALTH_VERCEL_TOKEN}"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ 请设置 VERCEL_TOKEN 环境变量"
  exit 1
fi

cd "$(dirname "$0")"

echo "🚀 开始部署家健..."

# Deploy
if [ "$1" = "--preview" ]; then
  echo "📦 Preview 部署..."
  npx vercel deploy --token "$VERCEL_TOKEN" --yes
else
  echo "🌐 Production 部署..."
  npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes
fi

echo "✅ 部署完成！"
echo "🔗 https://familyhealth-sigma.vercel.app"
