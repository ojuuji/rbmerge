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

# At the moment of switching tables data to gzip+base64 resulting JS size
# reduced from ~4.5mb to ~1.2mb. However, when serving to browser due to
# 'Content-Enconding: gzip' this only saved ~33kb. Well, still something.
# Plus no interference with JS escaping in string literals. Plus GitHub
# now does not refuse to open JS file in viewer.

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

echo ":: done"
