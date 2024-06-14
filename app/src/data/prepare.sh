#! /bin/bash

set -eu

WORKDIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"
DBDIR="${WORKDIR}/../../../tables"

"${DBDIR}/download.sh"

echo ":: generating colors.json ..."

SQL_COLORS="SELECT json_group_array(name ORDER BY p.sort_pos) FROM colors NATURAL JOIN color_properties p"
sqlite3 "${DBDIR}/rb.db" "$SQL_COLORS" > "${WORKDIR}/colors.json"

echo ":: generating rels.json ..."

SQL_RELS="$(cat <<EOF
SELECT json_group_array(
	json_array(
		child_part_num || ':' || rel_type,
		parent_part_num
	) ORDER BY 1, 2
) FROM (
	SELECT *
	  FROM part_relationships
	 WHERE rel_type IN ('P', 'T')
	 UNION
	SELECT *
	  FROM part_rels_resolved
	 WHERE rel_type IN ('A', 'M')
) t;
EOF
)"
sqlite3 "${DBDIR}/rb.db" "$SQL_RELS" > "${WORKDIR}/rels.json"

echo ":: generating relsEx.json ..."

SQL_RELS_EX="$(cat <<EOF
SELECT json_group_array(
	json_array(
		child_part_num || ':' || rel_type,
		parent_part_num
	) ORDER BY 1, 2
) FROM (
	SELECT *
	  FROM part_rels_extra
	 WHERE rel_type IN ('A', 'M', 'P', 'T')
) t;
EOF
)"
sqlite3 "${DBDIR}/rb.db" "$SQL_RELS_EX" > "${WORKDIR}/relsEx.json"
