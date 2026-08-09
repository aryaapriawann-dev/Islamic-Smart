import numpy as np


def hitung_sudut(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))
    return angle if angle <= 180 else 360 - angle


def get_coord(lm, idx, w, h):
    return [lm[idx].x * w, lm[idx].y * h]
