#! /bin/bash -eu

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"

which curl gunzip > /dev/null

for FILE in parts.csv part_relationships.csv colors.csv; do
	echo ":: fetching $FILE ..."
	curl -s "https://cdn.rebrickable.com/media/downloads/$FILE.gz" -o "${WORKDIR}/${FILE}.gz"
	gunzip -f "${WORKDIR}/${FILE}.gz"
done

echo ":: verifying ..."

[[ "part_num,name,part_cat_id,part_material" == "$(head -1 "${WORKDIR}/parts.csv")" ]] || Die "unexpected structure of parts.csv"
[[ "rel_type,child_part_num,parent_part_num" == "$(head -1 "${WORKDIR}/part_relationships.csv")" ]] || Die "unexpected structure of part_relationships.csv"
[[ "id,name,rgb,is_trans" == "$(head -1 "${WORKDIR}/colors.csv")" ]] || Die "unexpected structure of colors.csv"

echo ":: done"
