.bail ON

SELECT json_group_array(
         json_array(
           child_part_num || ':' || rel_type,
           parent_part_num
         ) ORDER BY 1, 2
       )
  FROM (SELECT *
          FROM part_rels_extra
         WHERE rel_type IN ('A', 'M', 'P', 'T')
       )
