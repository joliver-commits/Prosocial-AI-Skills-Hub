#!/usr/bin/env bash
#
# sync-skills.sh — copy this repo's skills into .claude/skills/ so they load in
# Claude Code.
#
# For every skills/**/SKILL.md, the skill's folder is copied to
#
#     .claude/skills/<skill-name>/
#
# as real files, flattened — the persona directory (young-person/, caregiver/, …)
# is part of the canonical source layout but is not reproduced in the install
# target, because Claude Code expects each skill directory directly under
# skills/. Copies rather than symlinks, so the skills load on any agent version
# regardless of whether it follows symlinked skill folders.
#
# Idempotent: re-running replaces each installed skill with the current source,
# so the target always matches skills/. Re-run after editing anything in skills/.
#
# Usage:
#   bash scripts/sync-skills.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$REPO_ROOT/skills"
TARGET="$REPO_ROOT/.claude/skills"

if [ ! -d "$SKILLS_SRC" ]; then
  echo "sync-skills.sh: no skills/ directory at $SKILLS_SRC" >&2
  exit 1
fi

# Read the `name:` field from a SKILL.md's frontmatter.
frontmatter_name() {
  awk '
    NR == 1 && $0 != "---" { exit }
    NR == 1 { in_fm = 1; next }
    in_fm && $0 == "---" { exit }
    in_fm && /^name:[[:space:]]*/ {
      sub(/^name:[[:space:]]*/, "")
      gsub(/^["'"'"']|["'"'"']$/, "")
      print
      exit
    }
  ' "$1"
}

skill_dirs=()
while IFS= read -r skill_md; do
  skill_dirs+=("$(dirname "$skill_md")")
done < <(find "$SKILLS_SRC" -type f -name 'SKILL.md' | sort)

if [ "${#skill_dirs[@]}" -eq 0 ]; then
  echo "sync-skills.sh: found no SKILL.md files under $SKILLS_SRC" >&2
  exit 1
fi

echo "Syncing skills from skills/ to .claude/skills/"
echo

mkdir -p "$TARGET"

count=0
warnings=0

for dir in "${skill_dirs[@]}"; do
  folder="$(basename "$dir")"
  persona="$(basename "$(dirname "$dir")")"
  name="$(frontmatter_name "$dir/SKILL.md")"

  if [ -z "$name" ]; then
    name="$folder"
    echo "  !  $folder: no 'name' in frontmatter; using folder name"
    warnings=$((warnings + 1))
  elif [ "$name" != "$folder" ]; then
    echo "  !  $folder: frontmatter name '$name' does not match folder name"
    warnings=$((warnings + 1))
  fi

  dest="$TARGET/$name"

  # Replace wholesale so the target always matches source exactly, including
  # files deleted from the source since the last sync.
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$dir/." "$dest/"

  files="$(find "$dest" -type f | wc -l | tr -d ' ')"
  echo "  copied  skills/$persona/$folder  ->  .claude/skills/$name/  ($files files)"
  count=$((count + 1))
done

echo
echo "Synced $count skills, warnings $warnings."
echo "Restart Claude Code, then run /skills to confirm they loaded."
