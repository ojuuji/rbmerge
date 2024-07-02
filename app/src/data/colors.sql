.bail ON

SELECT json_group_array(name ORDER BY p.sort_pos)
  FROM colors
  JOIN color_properties p
 USING (id)
