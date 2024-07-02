.bail ON

SELECT json_group_array(
         json_array(
           part_num || ':' || color_id,
           replace(img_url, 'https://cdn.rebrickable.com/media/parts/', '/')
         ) ORDER BY 1
       )
  FROM part_color_stats
 WHERE img_url IS NOT NULL
