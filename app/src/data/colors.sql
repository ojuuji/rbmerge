.bail ON

SELECT json_group_array(
         json_array(
           id,
           json_array(
             name,
             sort_pos
           )
         ) ORDER BY sort_pos
       )
  FROM colors
  JOIN color_properties p
 USING (id)
