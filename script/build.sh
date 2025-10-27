#! /bin/bash

set -eu
set -o pipefail

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"

which base64 gzip sqlite3 > /dev/null

"${WORKDIR}/../tables/download.sh"
DB="${WORKDIR}/../tables/rb.db"

SOURCE="${WORKDIR}/rbmerge.base.js"
SOURCE_META="${WORKDIR}/rbmerge.meta.js"
TARGET="${WORKDIR}/../www/js/rbmerge.js"
TARGET_META="${WORKDIR}/../www/js/rbmerge.meta.js"

mkdir -p "$(dirname "$TARGET")"

# Get individually to catch errors
TS1="$(git log -1 --format="%at" "$SOURCE" "$SOURCE_META")"
TS2="$(sqlite3 "$DB" "SELECT value FROM rb_db_lov WHERE key = 'data_timestamp'")"
[[ "$TS1" -gt "$TS2" ]] && TS="$TS1" || TS="$TS2"

VERSION="$(date --utc --date=@"$TS" +%F.%H-%M-%S)"
echo ":: determined version number: $VERSION"

echo ":: generating $(basename "$TARGET_META") ..."
sed "/^\/\/ ==UserScript==$/a // @version      $VERSION" "$SOURCE_META" > "$TARGET_META"

echo ":: generating $(basename "$TARGET") ..."

cp -f "$TARGET_META" "$TARGET"

FIRST_LINE=$(grep -n 'const relsData = ' "$SOURCE" | grep -Po '^\d+') || Die "failed to get index of first line to replace"
LAST_LINE=$(grep -n 'const colorsData = ' "$SOURCE" | grep -Po '^\d+') || Die "failed to get index of last line to replace"

head -n$((FIRST_LINE-1)) "$SOURCE" >> "$TARGET"

# Due to 'Content-Enconding: gzip' applying gzip+base64 here makes almost no
# difference for the serve sizes. However it avoids the need of JS escaping in
# string literals. And smaller size finally allows to open it in GitHub online
# viewer. So it is still worth it.

echo ":: building part relationships ..."

SQL_RELS="$(cat <<EOF
SELECT *
  FROM part_relationships
 WHERE rel_type IN ('P', 'T')
 UNION
SELECT *
  FROM part_rels_resolved
 WHERE rel_type IN ('A', 'M')
EOF
)"

echo -en '  const relsData = "' >> "$TARGET"
sqlite3 -csv "$DB" "$SQL_RELS" | tr -d '\r' | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

SQL_RELS_EX="$(cat <<EOF
SELECT *
  FROM part_rels_extra
 WHERE rel_type IN ('A', 'M', 'P', 'T')
EOF
)"

echo -en '  const relsExData = "' >> "$TARGET"
sqlite3 -csv "$DB" "$SQL_RELS_EX" | tr -d '\r' | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

echo ":: building colors ..."

echo -en '  const colorsData = "' >> "$TARGET"

SQL_COLORS="$(cat <<EOF
      SELECT name
        FROM colors
NATURAL JOIN color_properties p
    ORDER BY p.sort_pos
EOF
)"
sqlite3 -list "$DB" "$SQL_COLORS" | tr -d '\r' | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

tail -n+$((LAST_LINE+1)) "$SOURCE" >> "$TARGET"

TEMPLATE="${WORKDIR}/template.html"
echo ":: embedding $(basename "$TEMPLATE") ..."

TEMPLATE_LINE=$(grep -Fn "document.getElementsByTagName('body')[0].innerHTML = '{{TEMPLATE}}';" "$TARGET" | grep -Po '^\d+') || Die "failed to get line index"

head -n$((TEMPLATE_LINE-1)) "$TARGET" > "${TARGET}.tmp"
echo -e "  document.getElementsByTagName('body')[0].innerHTML = \`" >> "${TARGET}.tmp"
cat "$TEMPLATE" >> "${TARGET}.tmp"
echo '`;' >> "${TARGET}.tmp"
tail -n+$((TEMPLATE_LINE+1)) "$TARGET" >> "${TARGET}.tmp"

mv "${TARGET}.tmp" "$TARGET"

echo ":: done"
