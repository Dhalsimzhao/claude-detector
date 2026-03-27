#!/bin/bash
# Test script: sends various hook events and permission requests to the pet app.
# Usage: bash scripts/test-events.sh

PORT=$(cat ~/.claude-detector/port 2>/dev/null)
if [ -z "$PORT" ]; then
  echo "Error: ~/.claude-detector/port not found. Is the app running?"
  exit 1
fi

BASE="http://127.0.0.1:$PORT"
SID1="aaaa1111-2222-3333-4444-555566667777"
SID2="bbbb8888-9999-aaaa-bbbb-ccccddddeeee"

send_event() {
  curl -s -X POST "$BASE/event" -H 'Content-Type: application/json' -d "$1" > /dev/null
  echo "  -> sent"
}

send_permission() {
  echo "  -> waiting for response..."
  RESP=$(curl -s -X POST "$BASE/permission-request" -H 'Content-Type: application/json' -d "$1")
  echo "  -> response: $RESP"
}

echo "=== 1. Session start (session A) ==="
send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"SessionStart\"
}"
sleep 1

echo "=== 2. User prompt (short) ==="
send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"UserPromptSubmit\",
  \"prompt\": \"fix the bug\"
}"
sleep 2

echo "=== 3. Tool use - Bash (short command) ==="
send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"PreToolUse\",
  \"tool_name\": \"Bash\",
  \"tool_input\": {\"command\": \"ls -la\"}
}"
sleep 1

send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"PostToolUse\",
  \"tool_name\": \"Bash\",
  \"tool_input\": {\"command\": \"ls -la\"}
}"
sleep 2

echo "=== 4. Permission request - short file path ==="
send_permission "{
  \"requestId\": \"req-001\",
  \"sessionId\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"toolName\": \"Edit\",
  \"toolInput\": {\"file_path\": \"/Users/test/my-project/src/index.ts\"},
  \"timestamp\": $(date +%s)000
}"
sleep 2

echo "=== 5. Permission request - long file path ==="
send_permission "{
  \"requestId\": \"req-002\",
  \"sessionId\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"toolName\": \"Write\",
  \"toolInput\": {\"file_path\": \"/Users/test/my-project/src/components/features/authentication/LoginForm.tsx\"},
  \"timestamp\": $(date +%s)000
}"
sleep 2

echo "=== 6. Permission request - long Bash command ==="
send_permission "{
  \"requestId\": \"req-003\",
  \"sessionId\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"toolName\": \"Bash\",
  \"toolInput\": {\"command\": \"find . -name '*.ts' -not -path './node_modules/*' | xargs grep -l 'TODO' | head -20\"},
  \"timestamp\": $(date +%s)000
}"
sleep 2

echo "=== 7. Session B starts (second session) ==="
send_event "{
  \"session_id\": \"$SID2\",
  \"cwd\": \"/Users/test/another-repo\",
  \"hook_event_name\": \"SessionStart\"
}"
sleep 1

echo "=== 8. Session B running ==="
send_event "{
  \"session_id\": \"$SID2\",
  \"cwd\": \"/Users/test/another-repo\",
  \"hook_event_name\": \"UserPromptSubmit\",
  \"prompt\": \"refactor the auth module\"
}"
sleep 1

echo "=== 9. Permission on session B - JSON tool input ==="
send_permission "{
  \"requestId\": \"req-004\",
  \"sessionId\": \"$SID2\",
  \"cwd\": \"/Users/test/another-repo\",
  \"toolName\": \"Bash\",
  \"toolInput\": {\"command\": \"npm test\"},
  \"timestamp\": $(date +%s)000
}"
sleep 2

echo "=== 10. Tool use - Read (medium path) ==="
send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"PreToolUse\",
  \"tool_name\": \"Read\",
  \"tool_input\": {\"file_path\": \"/Users/test/my-project/package.json\"}
}"
sleep 1

send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"PostToolUse\",
  \"tool_name\": \"Read\",
  \"tool_input\": {\"file_path\": \"/Users/test/my-project/package.json\"}
}"
sleep 2

echo "=== 11. Notification ==="
send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"Notification\",
  \"notification_type\": \"info\",
  \"message\": \"Build completed successfully\"
}"
sleep 2

echo "=== 12. Stop session A ==="
send_event "{
  \"session_id\": \"$SID1\",
  \"cwd\": \"/Users/test/my-project\",
  \"hook_event_name\": \"Stop\"
}"
sleep 2

echo "=== 13. Stop session B ==="
send_event "{
  \"session_id\": \"$SID2\",
  \"cwd\": \"/Users/test/another-repo\",
  \"hook_event_name\": \"Stop\"
}"

echo ""
echo "=== Done! ==="
