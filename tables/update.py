from contextlib import closing
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


SQL_YEARS = """
  with part_years as (
           /* parts from sets */
    select sets.year year, ip.part_num part_num
      from sets
      join inventories i
        on i.set_num = sets.set_num
      join inventory_parts ip
        on ip.inventory_id = i.id
     union
           /* parts from minifigs included in the sets */
    select sets.year year, ip_fig.part_num part_num
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
select part_num, min(year), max(year)
  from part_years
 group by part_num
"""
SQL_MOLDS = """
select child_part_num c, parent_part_num p
  from part_relationships
 where rel_type = 'M'
   and (c in ({0}) or p in ({0}))
"""


def find_all_molds(con, molds):
    with closing(con.cursor()) as cur:
        old_molds = set()
        while len(old_molds) != len(molds):
            old_molds = molds
            molds = set()
            for a, b in cur.execute(SQL_MOLDS.format(','.join(f"'{m}'" for m in old_molds))):
                molds.update([a, b])
        return molds


def try_to_int(value):
    try:
        return int(value)
    except ValueError:
        return value


def split_part_num(part_num):
    return tuple(try_to_int(x) for x in re.split(r'(\d+)', part_num))


def resolve_molds(molds, years):
    ref = ""
    max_year = 0

    for mold in molds:
        if mold in years:
            if max_year < years[mold][1]:
                ref = mold
                max_year = years[mold][1]
            elif max_year == years[mold][1]:
                if years[ref][0] != years[mold][0]:
                    if years[ref][0] < years[mold][0]:
                        ref = mold
                # if both molds have the same year range take the smallest part num
                elif split_part_num(mold) < split_part_num(ref):
                    ref = mold
        # if both molds are unused take the largest part num
        elif 0 == max_year and split_part_num(mold) > split_part_num(ref):
            ref = mold

    molds.remove(ref)
    return ref, molds


def update_rels():
    with closing(sqlite3.connect(f'{WORKDIR}/../sqlite/dist/bricks.db')) as con, closing(sqlite3.connect(':memory:')) as mem:
        with mem, closing(mem.cursor()) as cur:
            cur.execute("create table rels (type char, child text, parent text)")

        years = {}
        with closing(con.cursor()) as cur:
            for part_num, min_year, max_year in cur.execute(SQL_YEARS):
                years[part_num] = [min_year, max_year]

        resolved = set()
        with mem, closing(con.cursor()) as cur:
            for rel_type, child, parent in cur.execute("select * from part_relationships where rel_type in ('A', 'M', 'P', 'T')"):
                if 'M' != rel_type:
                    mem.execute('insert into rels values (?, ?, ?)', (rel_type, child, parent))
                elif child not in resolved:
                    molds = find_all_molds(con, {child, parent})
                    ref, molds = resolve_molds(molds, years)
                    resolved.update([ref], molds)
                    for mold in molds:
                        mem.execute('insert into rels values (?, ?, ?)', ('M', mold, ref))

        with open(f'{WORKDIR}/rbm_part_relationships.csv', 'w') as f, closing(mem.cursor()) as cur:
            for row in cur.execute("select * from rels order by 1, 2, 3"):
                print(','.join(row), file=f)


if __name__ == '__main__':
    print(":: updating part relationships ...")
    update_rels()
    print(":: updating colors ...")
    update_colors()
    print(":: done")
