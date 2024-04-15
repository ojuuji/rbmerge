import colorsys
import csv
import os


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


if __name__ == "__main__":
    update_colors()
