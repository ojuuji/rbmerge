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
TARGET="${WORKDIR}/../www/js/rbmerge.js"

mkdir -p "$(dirname "$TARGET")"

FIRST_LINE=$(grep -n 'const relsData = ' "$SOURCE" | grep -Po '^\d+') || Die "failed to get index of first line to replace"
LAST_LINE=$(grep -n 'const colorsData = ' "$SOURCE" | grep -Po '^\d+') || Die "failed to get index of last line to replace"

head -n$((FIRST_LINE-1)) "$SOURCE" > "$TARGET"

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

DEPS=("$SOURCE" "${WORKDIR}/../tables/"{part_relationships_ex,rbm_colors,rbm_part_relationships}.csv)
VERSION="$(date --utc --date=@"$(git log -1 --format="%at" "${DEPS[@]}")" +%F.%H-%M-%S)"
echo ":: embedding version number $VERSION ..."
sed -i "/^\/\/ ==UserScript==$/a // @version      $VERSION" "$TARGET"

echo ":: done"
