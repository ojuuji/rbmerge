from contextlib import closing
from functools import cmp_to_key
import colorsys
import csv
import os
import re
import sqlite3


WORKDIR = os.path.dirname(os.path.abspath(__file__))


class Color:
    HARDCODED_ORDER = ["[Unknown]", "[No Color/Any Color]", "White", "Black"]
    GRAY_THRESHOLD = 20 / 255.0

    def __init__(self, name, hex):
        self.name = name
        self.r, self.g, self.b = [int(hex[x: x + 2], 16) / 255.0 for x in [0, 2, 4]]

    def __lt__(self, other):
        if self.name == other.name:
            return False

        for color in Color.HARDCODED_ORDER:
            if self.name == color:
                return True
            if other.name == color:
                return False

        ldiff = max(abs(self.r - self.g), abs(self.r - self.b), abs(self.g - self.b))
        rdiff = max(abs(other.r - other.g), abs(other.r - other.b), abs(other.g - other.b))

        if ldiff < Color.GRAY_THRESHOLD and rdiff < Color.GRAY_THRESHOLD:
            return self.r < other.r
        if ldiff < Color.GRAY_THRESHOLD or rdiff < Color.GRAY_THRESHOLD:
            return rdiff >= Color.GRAY_THRESHOLD

        lh, ls, lv = colorsys.rgb_to_hsv(self.r, self.g, self.b)
        rh, rs, rv = colorsys.rgb_to_hsv(other.r, other.g, other.b)

        return lh < rh if lh != rh else ls < rs if ls != rs else lv < rv


def update_colors():
    with open(f'{WORKDIR}/../sqlite/tables/colors.csv') as f:
        cf = csv.reader(f)
        colors = sorted([Color(row[1], row[2]) for row in cf])

    with open(f'{WORKDIR}/rbm_colors.csv', 'w') as f:
        for color in colors:
            print(color.name, file=f)


SQL_STATS = """
  with part_stats as (
           /* parts from sets */
    select sets.set_num set_num, sets.year year, ip.part_num part_num
      from sets
      join inventories i
        on i.set_num = sets.set_num
      join inventory_parts ip
        on ip.inventory_id = i.id
     union
           /* parts from minifigs included in the sets */
    select i_fig.set_num set_num, sets.year year, ip_fig.part_num part_num
      from sets
      join inventories i
        on i.set_num = sets.set_num
      join inventory_minifigs im
        on im.inventory_id = i.id
      join inventories i_fig
        on i_fig.set_num = im.fig_num
      join inventory_parts ip_fig
        on ip_fig.inventory_id = i_fig.id
)
select part_num, count(set_num), min(year), max(year)
  from part_stats
 group by part_num
"""

SQL_RELS_EXPAND = """
select child_part_num c, parent_part_num p
  from part_relationships
 where rel_type = '{0}'
   and (c in ({1}) or p in ({1}))
"""

SQL_RELS_LIST = """
select *
  from part_relationships
 where rel_type in ('A', 'M', 'P', 'T')
"""


def find_all_rels(rel_type, con, rels):
    with closing(con.cursor()) as cur:
        old_rels = set()
        while len(old_rels) != len(rels):
            old_rels = rels
            rels = set()
            sql = SQL_RELS_EXPAND.format(rel_type, ','.join(f"'{m}'" for m in old_rels))
            for a, b in cur.execute(sql):
                rels.update([a, b])
        return rels


def try_to_int(value):
    try:
        return int(value)
    except ValueError:
        return value


def split_part_num(part_num):
    return tuple(try_to_int(x) for x in re.split(r'(\d+)', part_num))


def cmp_parts(a, b, stats, rel_type):
    has_stats_a = a in stats
    has_stats_b = b in stats
    if has_stats_a != has_stats_b:
        return -1 if has_stats_a else 1

    if has_stats_a:
        num_sets_a, min_year_a, max_year_a = stats[a]
        num_sets_b, min_year_b, max_year_b = stats[b]

        if max_year_a != max_year_b:
            return max_year_b - max_year_a

        if 'M' == rel_type and min_year_a != min_year_b:
            return min_year_b - min_year_a

        if num_sets_a != num_sets_b:
            return num_sets_b - num_sets_a

    sa = split_part_num(a)
    sb = split_part_num(b)

    return -1 if sa < sb else 1 if sa > sb else 0


def update_rels():
    with closing(sqlite3.connect(f'{WORKDIR}/../sqlite/dist/bricks.db')) as con, closing(sqlite3.connect(':memory:')) as mem:
        with mem, closing(mem.cursor()) as cur:
            cur.execute("create table rels (type char, child text, parent text)")

        stats = {}
        with closing(con.cursor()) as cur:
            for part_num, num_sets, min_year, max_year in cur.execute(SQL_STATS):
                stats[part_num] = [num_sets, min_year, max_year]

        resolved = {'A': set(), 'M': set()}
        with mem, closing(con.cursor()) as cur:
            for rel_type, child, parent in cur.execute(SQL_RELS_LIST):
                if rel_type not in resolved:
                    mem.execute('insert into rels values (?, ?, ?)', (rel_type, child, parent))
                elif child not in resolved[rel_type]:
                    rels = find_all_rels(rel_type, con, {child, parent})
                    resolved[rel_type].update(rels)
                    rels = sorted(list(rels), key=cmp_to_key(lambda a, b: cmp_parts(a, b, stats, rel_type)))
                    for rel in rels[1:]:
                        mem.execute('insert into rels values (?, ?, ?)', (rel_type, rel, rels[0]))

        with open(f'{WORKDIR}/rbm_part_relationships.csv', 'w') as f, closing(mem.cursor()) as cur:
            for row in cur.execute("select * from rels order by 1, 2, 3"):
                print(','.join(row), file=f)


if __name__ == '__main__':
    print(":: updating part relationships ...")
    update_rels()
    print(":: updating colors ...")
    update_colors()
    print(":: done")
