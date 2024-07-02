.bail ON

SELECT json_group_array(
         json_array(
           child_part_num || ':' || rel_type,
           parent_part_num
         ) ORDER BY 1, 2
       )
  FROM (SELECT *
          FROM part_relationships
         WHERE rel_type IN ('P', 'T')
         UNION ALL
        SELECT *
          FROM part_rels_resolved
         WHERE rel_type IN ('A', 'M')
       )
