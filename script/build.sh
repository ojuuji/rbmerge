#! /bin/bash -eu

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"

which base64 gzip > /dev/null

SOURCE="${WORKDIR}/rbmerge.base.js"
SOURCE_META="${WORKDIR}/rbmerge.meta.js"
TARGET="${WORKDIR}/../www/js/rbmerge.js"
TARGET_META="${WORKDIR}/../www/js/rbmerge.meta.js"

mkdir -p "$(dirname "$TARGET")"

DEPS=("$SOURCE" "$SOURCE_META" "${WORKDIR}/../tables/"{part_relationships_ex,rbm_colors,rbm_part_relationships}.csv)
VERSION="$(date --utc --date=@"$(git log -1 --format="%at" "${DEPS[@]}")" +%F.%H-%M-%S)"
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

echo -en '\tconst relsData = "' >> "$TARGET"
gzip -c9n "${WORKDIR}/../tables/rbm_part_relationships.csv" | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

echo -en '\tconst relsExData = "' >> "$TARGET"
grep -vPx '#.*|\s*' "${WORKDIR}/../tables/part_relationships_ex.csv" | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

echo ":: building colors ..."

echo -en '\tconst colorsData = "' >> "$TARGET"
gzip -c9n "${WORKDIR}/../tables/rbm_colors.csv" | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

tail -n+$((LAST_LINE+1)) "$SOURCE" >> "$TARGET"

TEMPLATE="${WORKDIR}/template.html"
echo ":: embedding $(basename "$TEMPLATE") ..."

TEMPLATE_LINE=$(grep -Fn "document.getElementsByTagName('body')[0].innerHTML = '{{TEMPLATE}}';" "$TARGET" | grep -Po '^\d+') || Die "failed to get line index"

head -n$((TEMPLATE_LINE-1)) "$TARGET" > "${TARGET}.tmp"
echo -e "\tdocument.getElementsByTagName('body')[0].innerHTML = \`" >> "${TARGET}.tmp"
cat "$TEMPLATE" >> "${TARGET}.tmp"
echo '`;' >> "${TARGET}.tmp"
tail -n+$((TEMPLATE_LINE+1)) "$TARGET" >> "${TARGET}.tmp"

mv "${TARGET}.tmp" "$TARGET"

echo ":: done"
