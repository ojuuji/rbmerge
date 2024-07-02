.bail ON

SELECT json_group_array(
         json_array(
           part_num,
           name
         ) ORDER BY part_num
       )
  FROM parts
