"""
Industrial packing algorithms for 2D bin packing.
Implements: MaxRects (BAF/BSSF/BLSF/BL/CP), Guillotine (6 splits), Skyline, Shelf.
"""
from __future__ import annotations
from typing import List, Optional, Tuple
from .domain import Piece, PlacedPiece, FreeSpace, EdgeBanding

Rect = Tuple[float, float, float, float]  # (x, y, w, h)


# ─────────────────────────────────────────────────────────────────────────────
# MaxRects
# ─────────────────────────────────────────────────────────────────────────────

class MaxRectsSheet:
    """
    MaxRects algorithm with 5 heuristics:
    BAF (Best Area Fit), BSSF (Best Short Side Fit),
    BLSF (Best Long Side Fit), BL (Bottom Left), CP (Contact Point).
    """

    HEURISTICS = ('BAF', 'BSSF', 'BLSF', 'BL', 'CP')

    def __init__(self, bw: float, bh: float, kerf: float, heuristic: str = 'BAF'):
        self.bw = bw
        self.bh = bh
        self.kerf = kerf
        self.heuristic = heuristic
        self.placed: List[PlacedPiece] = []
        self.free: List[Rect] = [(0.0, 0.0, bw, bh)]

    @property
    def area_used(self) -> float:
        return sum(p.area for p in self.placed)

    @property
    def efficiency(self) -> float:
        t = self.bw * self.bh
        return self.area_used / t if t > 0 else 0.0

    def try_place(self, piece: Piece) -> Optional[PlacedPiece]:
        best_score = float('inf')
        best: Optional[Tuple[float, float, float, float, bool]] = None  # x,y,pw,ph,rotated

        orientations = [(piece.width, piece.height, False)]
        if piece.can_rotate and not piece.grain_direction and piece.width != piece.height:
            orientations.append((piece.height, piece.width, True))

        for pw, ph, rotated in orientations:
            for rx, ry, rw, rh in self.free:
                if pw + self.kerf > rw or ph + self.kerf > rh:
                    continue
                score = self._score(pw, ph, rx, ry, rw, rh)
                if score < best_score:
                    best_score = score
                    best = (rx, ry, pw, ph, rotated)

        if best is None:
            return None

        rx, ry, pw, ph, rotated = best
        eb = piece.edge_banding.rotate_cw() if rotated else piece.edge_banding
        pp = PlacedPiece(
            piece_id=piece.id, name=piece.name,
            x=rx, y=ry, width=pw, height=ph,
            rotated=rotated,
            original_width=piece.width, original_height=piece.height,
            can_rotate=piece.can_rotate,
            grain_direction=piece.grain_direction,
            edge_banding=eb,
        )
        self.placed.append(pp)
        self._split(rx, ry, pw + self.kerf, ph + self.kerf)
        self._prune()
        return pp

    def force_place(self, x: float, y: float, w: float, h: float,
                    piece_id: str = '', name: str = '',
                    rotated: bool = False, can_rotate: bool = True,
                    grain_direction: bool = False):
        """Force-place at exact coordinates (for sheet reconstruction)."""
        pp = PlacedPiece(
            piece_id=piece_id, name=name,
            x=x, y=y, width=w, height=h,
            rotated=rotated,
            original_width=w if not rotated else h,
            original_height=h if not rotated else w,
            can_rotate=can_rotate,
            grain_direction=grain_direction,
        )
        self.placed.append(pp)
        self._split(x, y, w + self.kerf, h + self.kerf)
        self._prune()

    def _score(self, pw: float, ph: float, rx: float, ry: float, rw: float, rh: float) -> float:
        h = self.heuristic
        if h == 'BAF':   return rw * rh - pw * ph
        if h == 'BSSF':  return min(rw - pw - self.kerf, rh - ph - self.kerf)
        if h == 'BLSF':  return max(rw - pw - self.kerf, rh - ph - self.kerf)
        if h == 'BL':    return ry * 1e9 + rx
        if h == 'CP':    return -self._contact(pw, ph, rx, ry)
        return rw * rh - pw * ph  # fallback = BAF

    def _contact(self, pw: float, ph: float, px: float, py: float) -> float:
        """Contact Point: total edge touching board borders + placed pieces."""
        contact = 0.0
        EPS = 0.5
        if px <= EPS:                 contact += ph
        if py <= EPS:                 contact += pw
        if px + pw >= self.bw - EPS: contact += ph
        if py + ph >= self.bh - EPS: contact += pw
        for p in self.placed:
            if abs(p.x + p.width - px) < EPS:
                ov = min(py + ph, p.y + p.height) - max(py, p.y)
                if ov > 0: contact += ov
            if abs(px + pw - p.x) < EPS:
                ov = min(py + ph, p.y + p.height) - max(py, p.y)
                if ov > 0: contact += ov
            if abs(p.y + p.height - py) < EPS:
                ov = min(px + pw, p.x + p.width) - max(px, p.x)
                if ov > 0: contact += ov
            if abs(py + ph - p.y) < EPS:
                ov = min(px + pw, p.x + p.width) - max(px, p.x)
                if ov > 0: contact += ov
        return contact

    def _split(self, px: float, py: float, pw: float, ph: float):
        add: List[Rect] = []
        rem: List[Rect] = []
        for r in self.free:
            rx, ry, rw, rh = r
            if not (px < rx + rw and px + pw > rx and py < ry + rh and py + ph > ry):
                continue
            rem.append(r)
            if px + pw < rx + rw: add.append((px + pw, ry, rx + rw - (px + pw), rh))
            if px > rx:           add.append((rx, ry, px - rx, rh))
            if py + ph < ry + rh: add.append((rx, py + ph, rw, ry + rh - (py + ph)))
            if py > ry:           add.append((rx, ry, rw, py - ry))
        for r in rem: self.free.remove(r)
        self.free.extend(add)

    def _prune(self):
        bad = set()
        n = len(self.free)
        for i in range(n):
            if i in bad: continue
            xi, yi, wi, hi = self.free[i]
            for j in range(n):
                if i == j or j in bad: continue
                xj, yj, wj, hj = self.free[j]
                if xi >= xj and yi >= yj and xi + wi <= xj + wj and yi + hi <= yj + hj:
                    bad.add(i); break
        if bad:
            self.free = [r for i, r in enumerate(self.free) if i not in bad]

    def get_free_spaces(self, min_size: float = 50.0) -> List[FreeSpace]:
        raw = [FreeSpace(x=rx, y=ry, width=rw, height=rh)
               for rx, ry, rw, rh in self.free
               if rw >= min_size and rh >= min_size]
        # Remove contained spaces
        result = []
        for s in raw:
            if not any(s is not o and
                       s.x >= o.x and s.y >= o.y and
                       s.right <= o.right and s.bottom <= o.bottom
                       for o in raw):
                result.append(s)
        return sorted(result, key=lambda s: s.area, reverse=True)


# ─────────────────────────────────────────────────────────────────────────────
# Guillotine
# ─────────────────────────────────────────────────────────────────────────────

class GuillotineSheet:
    """
    Guillotine packing: each placement splits one free rect into exactly 2.
    Mimics real panel-saw cuts.
    Split strategies: SAS, LAS, SLAS, LLAS, MAXAS, MINAS.
    """

    SPLITS = ('SAS', 'LAS', 'SLAS', 'LLAS', 'MAXAS', 'MINAS')

    def __init__(self, bw: float, bh: float, kerf: float, split: str = 'SAS'):
        self.bw = bw
        self.bh = bh
        self.kerf = kerf
        self.split = split
        self.placed: List[PlacedPiece] = []
        self.free: List[Rect] = [(0.0, 0.0, bw, bh)]

    @property
    def area_used(self) -> float:
        return sum(p.area for p in self.placed)

    def try_place(self, piece: Piece) -> Optional[PlacedPiece]:
        best_score = float('inf')
        best_idx = -1
        best_pw = piece.width
        best_ph = piece.height
        best_rot = False

        orientations = [(piece.width, piece.height, False)]
        if piece.can_rotate and not piece.grain_direction and piece.width != piece.height:
            orientations.append((piece.height, piece.width, True))

        for pw, ph, rotated in orientations:
            for i, (rx, ry, rw, rh) in enumerate(self.free):
                if pw + self.kerf <= rw and ph + self.kerf <= rh:
                    score = rw * rh - pw * ph
                    if score < best_score:
                        best_score = score
                        best_idx = i
                        best_pw, best_ph, best_rot = pw, ph, rotated

        if best_idx == -1:
            return None

        rx, ry, rw, rh = self.free[best_idx]
        eb = piece.edge_banding.rotate_cw() if best_rot else piece.edge_banding
        pp = PlacedPiece(
            piece_id=piece.id, name=piece.name,
            x=rx, y=ry, width=best_pw, height=best_ph,
            rotated=best_rot,
            original_width=piece.width, original_height=piece.height,
            can_rotate=piece.can_rotate,
            grain_direction=piece.grain_direction,
            edge_banding=eb,
        )
        self.placed.append(pp)
        self.free.pop(best_idx)
        r1, r2 = self._guillotine(rx, ry, rw, rh, best_pw + self.kerf, best_ph + self.kerf)
        if r1: self.free.append(r1)
        if r2: self.free.append(r2)
        return pp

    def force_place(self, x: float, y: float, w: float, h: float, **kw):
        pp = PlacedPiece(piece_id=kw.get('piece_id',''), name=kw.get('name',''),
                         x=x, y=y, width=w, height=h, rotated=False,
                         original_width=w, original_height=h, can_rotate=True)
        self.placed.append(pp)
        occupied_w = w + self.kerf
        occupied_h = h + self.kerf
        new_free = []
        for rx, ry, rw, rh in self.free:
            if not (x < rx + rw and x + occupied_w > rx and y < ry + rh and y + occupied_h > ry):
                new_free.append((rx, ry, rw, rh))
        self.free = new_free

    def _guillotine(self, rx, ry, rw, rh, pw, ph):
        lw = rw - pw
        lh = rh - ph
        s = self.split
        if   s == 'SAS':   horiz = lh < lw
        elif s == 'LAS':   horiz = lh >= lw
        elif s == 'SLAS':  horiz = rw < rh
        elif s == 'LLAS':  horiz = rw >= rh
        elif s == 'MAXAS': horiz = lh > lw
        else:              horiz = lh <= lw  # MINAS
        k = self.kerf
        if horiz:
            r1 = (rx + pw, ry, lw, ph)      if lw > k else None
            r2 = (rx, ry + ph, rw, lh)      if lh > k else None
        else:
            r1 = (rx, ry + ph, pw, lh)      if lh > k else None
            r2 = (rx + pw, ry, lw, rh)      if lw > k else None
        return r1, r2

    def get_free_spaces(self, min_size: float = 50.0) -> List[FreeSpace]:
        return [FreeSpace(x=rx, y=ry, width=rw, height=rh)
                for rx, ry, rw, rh in self.free
                if rw >= min_size and rh >= min_size]


# ─────────────────────────────────────────────────────────────────────────────
# Skyline
# ─────────────────────────────────────────────────────────────────────────────

class SkylineSheet:
    """
    Skyline Bottom-Left algorithm.
    Places pieces at the lowest available position along the skyline profile.
    """

    def __init__(self, bw: float, bh: float, kerf: float):
        self.bw = bw
        self.bh = bh
        self.kerf = kerf
        self.placed: List[PlacedPiece] = []
        # Skyline: list of (x, width, height) — sorted by x
        self.skyline: List[Tuple[float, float, float]] = [(0.0, bw, 0.0)]

    @property
    def area_used(self) -> float:
        return sum(p.area for p in self.placed)

    def try_place(self, piece: Piece) -> Optional[PlacedPiece]:
        best_score = float('inf')
        best: Optional[Tuple[float, float, float, float, bool]] = None

        for pw, ph, rotated in self._orientations(piece):
            pos = self._find_position(pw + self.kerf, ph + self.kerf)
            if pos is None:
                continue
            x, y = pos
            score = y * 1e9 + x
            if score < best_score:
                best_score = score
                best = (x, y, pw, ph, rotated)

        if best is None:
            return None

        x, y, pw, ph, rotated = best
        eb = piece.edge_banding.rotate_cw() if rotated else piece.edge_banding
        pp = PlacedPiece(
            piece_id=piece.id, name=piece.name,
            x=x, y=y, width=pw, height=ph,
            rotated=rotated,
            original_width=piece.width, original_height=piece.height,
            can_rotate=piece.can_rotate,
            grain_direction=piece.grain_direction,
            edge_banding=eb,
        )
        self.placed.append(pp)
        self._update_skyline(x, y, pw + self.kerf, ph + self.kerf)
        return pp

    def force_place(self, x: float, y: float, w: float, h: float, **kw):
        pp = PlacedPiece(piece_id='', name='', x=x, y=y, width=w, height=h,
                         rotated=False, original_width=w, original_height=h, can_rotate=True)
        self.placed.append(pp)
        self._update_skyline(x, y, w + self.kerf, h + self.kerf)

    def _orientations(self, piece: Piece):
        yield piece.width, piece.height, False
        if piece.can_rotate and not piece.grain_direction and piece.width != piece.height:
            yield piece.height, piece.width, True

    def _find_position(self, pw: float, ph: float) -> Optional[Tuple[float, float]]:
        x = 0.0
        while x + pw <= self.bw + 0.01:
            y = self._max_height_in(x, pw)
            if y + ph <= self.bh + 0.01:
                return (x, y)
            # Advance x to the right edge of the tallest segment in [x, x+pw]
            x = self._next_x(x, pw)
            if x is None:
                break
        return None

    def _max_height_in(self, x: float, pw: float) -> float:
        return max((sh for sx, sw, sh in self.skyline
                    if sx < x + pw and sx + sw > x), default=0.0)

    def _next_x(self, x: float, pw: float) -> Optional[float]:
        max_h = -1.0
        next_x = None
        for sx, sw, sh in self.skyline:
            if sx < x + pw and sx + sw > x and sh > max_h:
                max_h = sh
                next_x = sx + sw
        return next_x

    def _update_skyline(self, px: float, py: float, pw: float, ph: float):
        new_sky: List[Tuple[float, float, float]] = []
        new_top = py + ph
        for sx, sw, sh in self.skyline:
            if sx + sw <= px or sx >= px + pw:
                new_sky.append((sx, sw, sh))
                continue
            if sx < px:
                new_sky.append((sx, px - sx, sh))
            ol_x = max(sx, px)
            ol_w = min(sx + sw, px + pw) - ol_x
            if ol_w > 0:
                new_sky.append((ol_x, ol_w, max(sh, new_top)))
            if sx + sw > px + pw:
                new_sky.append((px + pw, sx + sw - (px + pw), sh))
        new_sky.sort(key=lambda s: s[0])
        # Merge adjacent same-height segments
        merged: List[Tuple[float, float, float]] = []
        for seg in new_sky:
            if merged and merged[-1][2] == seg[2] and abs(merged[-1][0] + merged[-1][1] - seg[0]) < 0.1:
                mx, mw, mh = merged[-1]
                merged[-1] = (mx, seg[0] + seg[1] - mx, mh)
            else:
                merged.append(seg)
        self.skyline = merged

    def get_free_spaces(self, min_size: float = 50.0) -> List[FreeSpace]:
        spaces = []
        for sx, sw, sh in self.skyline:
            rh = self.bh - sh
            if sw >= min_size and rh >= min_size:
                spaces.append(FreeSpace(x=sx, y=sh, width=sw, height=rh))
        return spaces


# ─────────────────────────────────────────────────────────────────────────────
# Shelf
# ─────────────────────────────────────────────────────────────────────────────

class ShelfSheet:
    """
    Shelf First-Fit algorithm.
    Horizontal shelves; each shelf height = tallest piece in it.
    """

    def __init__(self, bw: float, bh: float, kerf: float):
        self.bw = bw
        self.bh = bh
        self.kerf = kerf
        self.placed: List[PlacedPiece] = []
        # shelves: [y, current_x, shelf_height]
        self.shelves: List[List[float]] = []
        self._next_y = 0.0

    @property
    def area_used(self) -> float:
        return sum(p.area for p in self.placed)

    def try_place(self, piece: Piece) -> Optional[PlacedPiece]:
        for pw, ph, rotated in self._orientations(piece):
            # Try existing shelves (first fit)
            for shelf in self.shelves:
                sy, sx, sh = shelf
                if ph + self.kerf <= sh and sx + pw + self.kerf <= self.bw:
                    pp = self._make_pp(piece, sx, sy, pw, ph, rotated)
                    self.placed.append(pp)
                    shelf[1] += pw + self.kerf
                    return pp
            # Open new shelf
            if self._next_y + ph + self.kerf <= self.bh:
                sy = self._next_y
                sh = ph + self.kerf
                pp = self._make_pp(piece, 0.0, sy, pw, ph, rotated)
                self.placed.append(pp)
                self.shelves.append([sy, pw + self.kerf, sh])
                self._next_y += sh
                return pp
        return None

    def force_place(self, x: float, y: float, w: float, h: float, **kw):
        pp = PlacedPiece(piece_id='', name='', x=x, y=y, width=w, height=h,
                         rotated=False, original_width=w, original_height=h, can_rotate=True)
        self.placed.append(pp)
        sh = h + self.kerf
        existing = next((s for s in self.shelves if abs(s[0] - y) < 1.0), None)
        if existing:
            existing[1] = max(existing[1], x + w + self.kerf)
        else:
            self.shelves.append([y, x + w + self.kerf, sh])
            if y + sh > self._next_y:
                self._next_y = y + sh

    def _make_pp(self, piece: Piece, x, y, pw, ph, rotated) -> PlacedPiece:
        eb = piece.edge_banding.rotate_cw() if rotated else piece.edge_banding
        return PlacedPiece(
            piece_id=piece.id, name=piece.name,
            x=x, y=y, width=pw, height=ph,
            rotated=rotated,
            original_width=piece.width, original_height=piece.height,
            can_rotate=piece.can_rotate,
            grain_direction=piece.grain_direction,
            edge_banding=eb,
        )

    def _orientations(self, piece: Piece):
        yield piece.width, piece.height, False
        if piece.can_rotate and not piece.grain_direction and piece.width != piece.height:
            yield piece.height, piece.width, True

    def get_free_spaces(self, min_size: float = 50.0) -> List[FreeSpace]:
        spaces = []
        for y, sx, sh in self.shelves:
            rw = self.bw - sx
            if rw >= min_size and sh >= min_size:
                spaces.append(FreeSpace(x=sx, y=y, width=rw, height=sh))
        if self._next_y < self.bh:
            rh = self.bh - self._next_y
            if rh >= min_size:
                spaces.append(FreeSpace(x=0.0, y=self._next_y, width=self.bw, height=rh))
        return spaces


# ─────────────────────────────────────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────────────────────────────────────

def create_sheet(algo: str, variant: str, bw: float, bh: float, kerf: float):
    if algo == 'maxrects':
        return MaxRectsSheet(bw, bh, kerf, variant or 'BAF')
    if algo == 'guillotine':
        return GuillotineSheet(bw, bh, kerf, variant or 'SAS')
    if algo == 'skyline':
        return SkylineSheet(bw, bh, kerf)
    if algo == 'shelf':
        return ShelfSheet(bw, bh, kerf)
    return MaxRectsSheet(bw, bh, kerf, 'BAF')


# All 13 configurations
ALL_CONFIGS = (
    [('maxrects',   h) for h in MaxRectsSheet.HEURISTICS] +
    [('guillotine', s) for s in GuillotineSheet.SPLITS] +
    [('skyline',    ''), ('shelf', '')]
)

# Fast subset for GA fitness evaluation
FAST_CONFIGS = [
    ('maxrects', 'BAF'), ('maxrects', 'BSSF'), ('maxrects', 'CP'),
    ('guillotine', 'SAS'), ('guillotine', 'MINAS'),
]
