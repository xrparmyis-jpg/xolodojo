#!/bin/bash
set -e
cd /home/cryptocreepn/Development/donovan/xolodojo/xolodojo
REPORT=/home/cryptocreepn/Development/donovan/xolodojo/xolodojo/.xolo-sync-report.txt
{
  echo "START $(date -Iseconds)"
  git fetch origin
  PREV=$(git branch --show-current)
  echo "PREV_BRANCH=$PREV"
  git status -sb
  echo "PROD=$(git rev-parse origin/prod)"
  echo "MAIN=$(git rev-parse origin/main)"
  echo "=== commits on prod not main ==="
  git log --oneline origin/main..origin/prod || true
  echo "=== commits on main not prod ==="
  git log --oneline origin/prod..origin/main || true
  if git cat-file -e origin/prod:src/components/TeamMemberSocialLinks.tsx 2>/dev/null; then echo "TEAM_COMPONENT_ON_PROD=yes"; else echo "TEAM_COMPONENT_ON_PROD=no"; fi
  if git cat-file -e origin/main:src/components/TeamMemberSocialLinks.tsx 2>/dev/null; then echo "TEAM_COMPONENT_ON_MAIN=yes"; else echo "TEAM_COMPONENT_ON_MAIN=no"; fi
  DIRTY=0
  if [ -n "$(git status --porcelain)" ]; then DIRTY=1; git stash push -u -m "wip before syncing main to prod"; fi
  git checkout main
  git reset --hard origin/main
  if git merge --ff-only origin/prod; then echo "MERGE=ff-only ok"; else echo "MERGE=ff failed, trying merge"; git merge origin/prod -m "Merge prod into main to sync accidental prod work"; fi
  git push origin main
  git fetch origin
  echo "AFTER_PROD=$(git rev-parse origin/prod)"
  echo "AFTER_MAIN=$(git rev-parse origin/main)"
  if [ "$(git rev-parse origin/prod)" = "$(git rev-parse origin/main)" ]; then echo "MATCH=yes"; else echo "MATCH=no"; fi
  git checkout "$PREV" || true
  if [ "$DIRTY" = "1" ]; then git stash pop || true; fi
  echo "END $(date -Iseconds)"
} > "$REPORT" 2>&1
cp "$REPORT" /tmp/xolo-sync-report.txt
cat "$REPORT"
