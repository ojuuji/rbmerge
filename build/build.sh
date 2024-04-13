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

SOURCE="${WORKDIR}/../rbmerge.base.js"
TARGET="${WORKDIR}/rbmerge.js"

FIRST_LINE=$(grep -n 'const partsData = ' "$SOURCE" | grep -Po '^\d+') || Die "failed to get index of first line to replace"
LAST_LINE=$(grep -n 'const colorsData = ' "$SOURCE" | grep -Po '^\d+') || Die "failed to get index of last line to replace"

head -n$((FIRST_LINE-1)) "$SOURCE" > "$TARGET"

echo ":: building parts ..."

# At the moment of switching tables data to gzip+base64 resulting JS size
# reduced from ~4.5mb to ~1.2mb. However, when serving to browser due to
# 'Content-Enconding: gzip' this only saved ~33kb. Well, still something.
# Plus no interference with JS escaping in string literals. Plus GitHub
# now does not refuse to open JS file in viewer.

echo -en '\t\tconst partsData = "' >> "$TARGET"
sed -r '1d; s/(,[^,]+){2}$//; s/"//g' "${WORKDIR}/../data/parts.csv" | while IFS=, read -r part_num name; do
	echo "${part_num},${name}"
done | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

echo ":: building part relationships ..."

echo -en '\t\tconst relsData = "' >> "$TARGET"
tail -n+2 "${WORKDIR}/../data/part_relationships.csv" | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

echo -en '\t\tconst relsExData = "' >> "$TARGET"
grep -vPx '#.*|\s*' "${WORKDIR}/../data/part_relationships_ex.csv" | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

echo ":: building colors ..."

echo -en '\t\tconst colorsData = "' >> "$TARGET"
tail -n+2 "${WORKDIR}/../data/colors.csv" | while IFS=, read -r id name rgb is_trans; do
	echo "${name},${rgb}"
done | gzip -9n | base64 -w0 >> "$TARGET"
echo '";' >> "$TARGET"

tail -n+$((LAST_LINE+1)) "$SOURCE" >> "$TARGET"

echo ":: done"
