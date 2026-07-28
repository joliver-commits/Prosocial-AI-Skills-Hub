#!/usr/bin/env bash
#
# install-local.sh — install this repo's skills into a Claude Code skills directory
# so they load in your own sessions.
#
# For every skills/**/SKILL.md, this creates
#
#     <target>/skills/<skill-name>  ->  skills/<persona>/<skill-name>
#
# as a symlink, so editing a skill in the repo takes effect without reinstalling.
# Some agent versions do not discover symlinked skill folders; if yours doesn't,
# re-run with --copy to install real copies instead.
#
# Usage:
#   scripts/install-local.sh              # install into ./.claude (this project only)
#   scripts/install-local.sh --user       # install into ~/.claude (all projects)
#   scripts/install-local.sh --copy       # copy instead of symlink
#   scripts/install-local.sh --dry-run    # show what would happen
#   scripts/install-local.sh --uninstall  # remove what this script installed
#
# Idempotent: safe to run repeatedly. Only entries this script owns are replaced;
# an unrelated directory already sitting at a target path is left alone and
# reported, not clobbered.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$REPO_ROOT/skills"

MODE="symlink"
SCOPE="project"
DRY_RUN=0
UNINSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --user)      SCOPE="user" ;;
    --project)   SCOPE="project" ;;
    --copy)      MODE="copy" ;;
    --symlink)   MODE="symlink" ;;
    --dry-run)   DRY_RUN=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help)
      sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "install-local.sh: unknown option '$1' (try --help)" >&2
      exit 2
      ;;
  esac
  shift
done

if [ "$SCOPE" = "user" ]; then
  TARGET_ROOT="$HOME/.claude"
else
  TARGET_ROOT="$REPO_ROOT/.claude"
fi
TARGET="$TARGET_ROOT/skills"

if [ ! -d "$SKILLS_SRC" ]; then
  echo "install-local.sh: no skills/ directory at $SKILLS_SRC" >&2
  exit 1
fi

# --- collect skills -----------------------------------------------------------
# Read the `name:` field from each SKILL.md's frontmatter; fall back to the folder
# name. Warn when they disagree, since the folder name is meant to match.

skill_dirs=()
while IFS= read -r skill_md; do
  skill_dirs+=("$(dirname "$skill_md")")
done < <(find "$SKILLS_SRC" -type f -name 'SKILL.md' | sort)

if [ "${#skill_dirs[@]}" -eq 0 ]; then
  echo "install-local.sh: found no SKILL.md files under $SKILLS_SRC" >&2
  exit 1
fi

frontmatter_name() {
  # First `name:` inside the leading --- fenced block.
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

linked=0
unchanged=0
skipped=0
warnings=0

if [ "$UNINSTALL" -eq 1 ]; then
  echo "Uninstalling from $TARGET"
  for dir in "${skill_dirs[@]}"; do
    name="$(frontmatter_name "$dir/SKILL.md")"
    [ -n "$name" ] || name="$(basename "$dir")"
    dest="$TARGET/$name"
    if [ -L "$dest" ]; then
      [ "$DRY_RUN" -eq 1 ] || rm "$dest"
      echo "  removed symlink  $name"
      linked=$((linked + 1))
    elif [ -d "$dest" ] && [ -f "$dest/SKILL.md" ]; then
      [ "$DRY_RUN" -eq 1 ] || rm -rf "$dest"
      echo "  removed copy     $name"
      linked=$((linked + 1))
    else
      skipped=$((skipped + 1))
    fi
  done
  # Clean up the directory if we emptied it.
  if [ "$DRY_RUN" -eq 0 ] && [ -d "$TARGET" ]; then
    rmdir "$TARGET" 2>/dev/null || true
    rmdir "$TARGET_ROOT" 2>/dev/null || true
  fi
  echo
  echo "Removed $linked, left alone $skipped."
  exit 0
fi

echo "Installing skills from $SKILLS_SRC"
echo "                    to $TARGET"
dry_run_suffix=""
[ "$DRY_RUN" -eq 1 ] && dry_run_suffix=" (dry run)"
echo "                  mode $MODE$dry_run_suffix"
echo

[ "$DRY_RUN" -eq 1 ] || mkdir -p "$TARGET"

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
  rel="skills/$persona/$folder"

  # An existing entry we don't own: leave it be and say so.
  if [ -e "$dest" ] && [ ! -L "$dest" ] && [ ! -f "$dest/SKILL.md" ]; then
    echo "  ~  $name: something already at $dest that isn't a skill; skipped"
    skipped=$((skipped + 1))
    warnings=$((warnings + 1))
    continue
  fi

  if [ "$MODE" = "symlink" ]; then
    if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$dir" ]; then
      echo "  =  $name  ->  $rel (unchanged)"
      unchanged=$((unchanged + 1))
      continue
    fi
    if [ "$DRY_RUN" -eq 0 ]; then
      rm -rf "$dest"
      if ! ln -s "$dir" "$dest" 2>/dev/null; then
        # Filesystems without symlink support: fall back to a copy.
        echo "  !  $name: symlink failed; copying instead"
        warnings=$((warnings + 1))
        cp -R "$dir" "$dest"
        echo "  +  $name  <-  $rel (copied)"
        linked=$((linked + 1))
        continue
      fi
    fi
    echo "  +  $name  ->  $rel (symlink)"
    linked=$((linked + 1))
  else
    if [ "$DRY_RUN" -eq 0 ]; then
      rm -rf "$dest"
      cp -R "$dir" "$dest"
    fi
    echo "  +  $name  <-  $rel (copy)"
    linked=$((linked + 1))
  fi
done

echo
echo "Installed $linked, unchanged $unchanged, skipped $skipped, warnings $warnings."
echo
if [ "$MODE" = "symlink" ]; then
  echo "Symlinked, so edits in skills/ take effect immediately."
  echo "If /skills doesn't list them, re-run with --copy."
else
  echo "Copied, so re-run this script after editing anything in skills/."
fi
echo "Restart Claude Code, then run /skills to confirm they loaded."
