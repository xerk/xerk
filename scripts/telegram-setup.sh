#!/usr/bin/env bash
# One-shot Telegram setup for xerk.io alerts.
# 1. In Telegram, open @BotFather → /newbot → copy the token.
# 2. Send any message (e.g. "hi") to your new bot.
# 3. Run:  bash scripts/telegram-setup.sh <BOT_TOKEN>
set -euo pipefail
TOKEN="${1:?usage: telegram-setup.sh <BOT_TOKEN>}"
SITE="${SITE_URL:-https://www.xerk.io}"
SECRET="$(grep -m1 '^TELEGRAM_WEBHOOK_SECRET=' ~/.xerk-secrets.txt 2>/dev/null | cut -d= -f2- || true)"
[ -z "$SECRET" ] && SECRET="$(python3 -c 'import secrets;print(secrets.token_urlsafe(24))')"

CHAT=$(curl -s "https://api.telegram.org/bot$TOKEN/getUpdates" | python3 -c 'import sys,json;u=json.load(sys.stdin).get("result",[]);print(u[-1]["message"]["chat"]["id"] if u else "")')
[ -z "$CHAT" ] && { echo "No messages found — send your bot a message first, then re-run."; exit 1; }
echo "Chat id: $CHAT"

for env in production preview; do
  vercel env add TELEGRAM_BOT_TOKEN "$env" --type secret --value "$TOKEN" --yes --force >/dev/null
  vercel env add TELEGRAM_CHAT_ID "$env" --type config --value "$CHAT" --yes --force >/dev/null
  vercel env add TELEGRAM_WEBHOOK_SECRET "$env" --type secret --value "$SECRET" --yes --force >/dev/null
done
echo "Vercel env updated."

curl -s "https://api.telegram.org/bot$TOKEN/setWebhook" --data-urlencode "url=$SITE/api/telegram" --data-urlencode "secret_token=$SECRET" >/dev/null
curl -s "https://api.telegram.org/bot$TOKEN/setMyCommands" -H 'content-type: application/json' -d '{"commands":[{"command":"stats","description":"Visitors & leads, last 24h"},{"command":"week","description":"Last 7 days"},{"command":"leads","description":"Leads, last 30 days"}]}' >/dev/null
curl -s "https://api.telegram.org/bot$TOKEN/sendMessage" -d chat_id="$CHAT" -d text="✅ xerk.io alerts connected. Redeploy the site to activate (vercel --prod)." >/dev/null
echo "Webhook set to $SITE/api/telegram. Redeploy to activate."
