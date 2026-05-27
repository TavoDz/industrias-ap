"""
Industrias AP — Advanced 2D Cutting Optimizer
Algorithms: MaxRects (4 heuristics) + Guillotine (6 splits)
Search:      Genetic Algorithm over piece orderings
"""

import time
import random
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

# ─────────────────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PieceInput:
    id: int
    name: str
    w: float
    h: float
    can_rotate: bool = True

@dataclass
class PlacedPiece:
    piece_id: int
    name: str
    x: float
    y: float
    w: float
    h: float
    rotated: bool

@dataclass
class BoardResult:
    number: int
    pieces: List[PlacedPiece] = field(default_factory=list)

    @property
    def area_used(self) -> float:
        return sum(p.w * p.h for p in self.pieces)

@dataclass
class OptimizationResult:
    boards: List[BoardResult]
    board_w: float
    board_h: float
    algorithm: str = ""

    @property
    def boards_used(self) -> int:
        return len(self.boards)

    @property
    def total_area(self) -> float:
        return self.boards_used * self.board_w * self.board_h

    @property
    def area_used(self) -> float:
        return sum(b.area_used for b in self.boards)

    @property
    def efficiency(self) -> float:
        return (self.area_used / self.total_area * 100.0) if self.total_area else 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Internal rectangle
# ─────────────────────────────────────────────────────────────────────────────

class _R:
    __slots__ = ('x', 'y', 'w', 'h')
    def __init__(self, x, y, w, h):
        self.x = x; self.y = y; self.w = w; self.h = h


# ─────────────────────────────────────────────────────────────────────────────
# MaxRects — 4 heuristics: BAF, BSSF, BLSF, BL
# ─────────────────────────────────────────────────────────────────────────────

class MaxRectsSheet:
    def __init__(self, bw: float, bh: float, kerf: float, heuristic: str = 'BAF'):
        self.bw = bw; self.bh = bh; self.kerf = kerf; self.heuristic = heuristic
        self.placed: List[PlacedPiece] = []
        self.free: List[_R] = [_R(0, 0, bw, bh)]

    def try_place(self, piece: PieceInput) -> Optional[PlacedPiece]:
        best_score = float('inf')
        best_rect: Optional[_R] = None
        best_rot = False

        for r in self.free:
            s = self._score(piece.w, piece.h, r)
            if s is not None and s < best_score:
                best_score, best_rect, best_rot = s, r, False
            if piece.can_rotate and piece.w != piece.h:
                s = self._score(piece.h, piece.w, r)
                if s is not None and s < best_score:
                    best_score, best_rect, best_rot = s, r, True

        if best_rect is None:
            return None

        pw = piece.h if best_rot else piece.w
        ph = piece.w if best_rot else piece.h
        p = PlacedPiece(piece.id, piece.name, best_rect.x, best_rect.y, pw, ph, best_rot)
        self.placed.append(p)
        self._split(best_rect.x, best_rect.y, pw + self.kerf, ph + self.kerf)
        self._prune()
        return p

    def _score(self, pw, ph, r) -> Optional[float]:
        rw, rh = pw + self.kerf, ph + self.kerf
        if rw > r.w or rh > r.h:
            return None
        h = self.heuristic
        if h == 'BAF':  return r.w * r.h - pw * ph
        if h == 'BSSF': return min(r.w - rw, r.h - rh)
        if h == 'BLSF': return max(r.w - rw, r.h - rh)
        if h == 'BL':   return r.y * 1e9 + r.x
        return r.w * r.h - pw * ph

    def _split(self, px, py, pw, ph):
        add, rem = [], []
        for r in self.free:
            if not (px < r.x + r.w and px + pw > r.x and py < r.y + r.h and py + ph > r.y):
                continue
            rem.append(r)
            if px + pw < r.x + r.w: add.append(_R(px + pw, r.y, r.x + r.w - (px + pw), r.h))
            if px > r.x:            add.append(_R(r.x, r.y, px - r.x, r.h))
            if py + ph < r.y + r.h: add.append(_R(r.x, py + ph, r.w, r.y + r.h - (py + ph)))
            if py > r.y:            add.append(_R(r.x, r.y, r.w, py - r.y))
        for r in rem:
            self.free.remove(r)
        self.free.extend(add)

    def _prune(self):
        f = self.free
        bad = set()
        for i in range(len(f)):
            if i in bad: continue
            for j in range(len(f)):
                if i == j or j in bad: continue
                ri, rj = f[i], f[j]
                if ri.x >= rj.x and ri.y >= rj.y and ri.x+ri.w <= rj.x+rj.w and ri.y+ri.h <= rj.y+rj.h:
                    bad.add(i); break
        if bad:
            self.free = [r for i, r in enumerate(f) if i not in bad]

    def get_free(self) -> List[_R]:
        return self.free


# ─────────────────────────────────────────────────────────────────────────────
# Guillotine — 6 split strategies: SAS, LAS, SLAS, LLAS, MAXAS, MINAS
# Mimics real panel-saw behavior: each cut divides a rect into exactly 2.
# ─────────────────────────────────────────────────────────────────────────────

class GuillotineSheet:
    def __init__(self, bw: float, bh: float, kerf: float, split: str = 'SAS'):
        self.bw = bw; self.bh = bh; self.kerf = kerf; self.split = split
        self.placed: List[PlacedPiece] = []
        self.free: List[_R] = [_R(0, 0, bw, bh)]

    def try_place(self, piece: PieceInput) -> Optional[PlacedPiece]:
        best_score = float('inf')
        best_idx = -1
        best_rot = False

        for i, r in enumerate(self.free):
            s = self._score(piece.w, piece.h, r)
            if s is not None and s < best_score:
                best_score, best_idx, best_rot = s, i, False
            if piece.can_rotate and piece.w != piece.h:
                s = self._score(piece.h, piece.w, r)
                if s is not None and s < best_score:
                    best_score, best_idx, best_rot = s, i, True

        if best_idx == -1:
            return None

        r = self.free[best_idx]
        pw = piece.h if best_rot else piece.w
        ph = piece.w if best_rot else piece.h
        p = PlacedPiece(piece.id, piece.name, r.x, r.y, pw, ph, best_rot)
        self.placed.append(p)
        self.free.pop(best_idx)
        r1, r2 = self._guillotine(r, pw + self.kerf, ph + self.kerf)
        if r1: self.free.append(r1)
        if r2: self.free.append(r2)
        return p

    def _score(self, pw, ph, r) -> Optional[float]:
        if pw + self.kerf > r.w or ph + self.kerf > r.h:
            return None
        return r.w * r.h - pw * ph

    def _guillotine(self, r: _R, rw: float, rh: float) -> Tuple[Optional[_R], Optional[_R]]:
        lw = r.w - rw
        lh = r.h - rh
        s = self.split
        if   s == 'SAS':   horiz = lh < lw
        elif s == 'LAS':   horiz = lh >= lw
        elif s == 'SLAS':  horiz = r.w < r.h
        elif s == 'LLAS':  horiz = r.w >= r.h
        elif s == 'MAXAS': horiz = lh > lw
        else:              horiz = lh <= lw   # MINAS

        k = self.kerf
        if horiz:
            a = _R(r.x + rw, r.y, lw, rh) if lw > k else None
            b = _R(r.x, r.y + rh, r.w, lh) if lh > k else None
        else:
            a = _R(r.x, r.y + rh, rw, lh) if lh > k else None
            b = _R(r.x + rw, r.y, lw, r.h) if lw > k else None
        return a, b


# ─────────────────────────────────────────────────────────────────────────────
# Packing runner
# ─────────────────────────────────────────────────────────────────────────────

# 10 algorithm configurations (MaxRects×4 + Guillotine×6)
ALL_CONFIGS = (
    [('maxrects',   h) for h in ('BAF', 'BSSF', 'BLSF', 'BL')] +
    [('guillotine', s) for s in ('SAS', 'LAS', 'SLAS', 'LLAS', 'MAXAS', 'MINAS')]
)

# Lightweight configs used during GA fitness evaluation
FAST_CONFIGS = [
    ('maxrects', 'BAF'), ('maxrects', 'BSSF'),
    ('guillotine', 'SAS'), ('guillotine', 'MINAS'),
]


def _run(pieces: List[PieceInput], bw: float, bh: float, kerf: float,
         algo: str, heur: str) -> Optional[OptimizationResult]:
    boards: List[BoardResult] = []

    def new_sheet():
        return (MaxRectsSheet(bw, bh, kerf, heur)
                if algo == 'maxrects'
                else GuillotineSheet(bw, bh, kerf, heur))

    sheet = new_sheet()
    for piece in pieces:
        if sheet.try_place(piece) is None:
            if sheet.placed:
                boards.append(BoardResult(len(boards) + 1, list(sheet.placed)))
            sheet = new_sheet()
            if sheet.try_place(piece) is None:
                return None  # piece larger than board
    if sheet.placed:
        boards.append(BoardResult(len(boards) + 1, list(sheet.placed)))

    return OptimizationResult(boards, bw, bh, f"{algo}-{heur}")


def _is_better(a: OptimizationResult, b: Optional[OptimizationResult]) -> bool:
    if b is None:
        return True
    if a.boards_used != b.boards_used:
        return a.boards_used < b.boards_used
    return a.area_used > b.area_used


def _best_of_configs(pieces: List[PieceInput], bw: float, bh: float, kerf: float,
                     configs=ALL_CONFIGS) -> Optional[OptimizationResult]:
    best = None
    for algo, heur in configs:
        r = _run(pieces, bw, bh, kerf, algo, heur)
        if r and _is_better(r, best):
            best = r
    return best


# ─────────────────────────────────────────────────────────────────────────────
# Genetic Algorithm
# ─────────────────────────────────────────────────────────────────────────────

def _fitness(order: List[int], pieces: List[PieceInput],
             bw: float, bh: float, kerf: float, fast: bool = True) -> Tuple[int, float]:
    ordered = [pieces[i] for i in order]
    configs = FAST_CONFIGS if fast else ALL_CONFIGS
    boards_best = len(pieces) + 1
    area_best = 0.0
    for algo, heur in configs:
        r = _run(ordered, bw, bh, kerf, algo, heur)
        if r is None:
            continue
        if r.boards_used < boards_best or (r.boards_used == boards_best and r.area_used > area_best):
            boards_best, area_best = r.boards_used, r.area_used
    return boards_best, area_best


def _ox_crossover(p1: List[int], p2: List[int]) -> List[int]:
    n = len(p1)
    if n <= 2:
        return p1[:]
    a, b = sorted(random.sample(range(n), 2))
    child: List[Optional[int]] = [None] * n
    child[a:b] = p1[a:b]
    pool = [x for x in p2 if x not in child[a:b]]
    j = 0
    for i in range(n):
        if child[i] is None:
            child[i] = pool[j]; j += 1
    return child  # type: ignore


def _swap_mutate(order: List[int], rate: float = 0.05) -> List[int]:
    o = order[:]
    for i in range(len(o)):
        if random.random() < rate:
            j = random.randint(0, len(o) - 1)
            o[i], o[j] = o[j], o[i]
    return o


def _inversion_mutate(order: List[int], rate: float = 0.05) -> List[int]:
    o = order[:]
    if len(o) >= 2 and random.random() < rate:
        a, b = sorted(random.sample(range(len(o)), 2))
        o[a:b+1] = o[a:b+1][::-1]
    return o


def optimize(
    pieces: List[PieceInput],
    board_w: float,
    board_h: float,
    kerf: float = 3.0,
    time_limit: float = 25.0,
    pop_size: int = 60,
) -> OptimizationResult:

    n = len(pieces)
    if n == 0:
        return OptimizationResult([], board_w, board_h, "empty")

    deadline = time.time() + time_limit
    idx = list(range(n))

    # ── Initial population: 10 deterministic + random ─────────────────────
    def srt(key, rev=False):
        return sorted(idx, key=key, reverse=rev)

    population: List[List[int]] = [
        srt(lambda i: pieces[i].w * pieces[i].h, True),          # area ↓
        srt(lambda i: pieces[i].w * pieces[i].h),                 # area ↑
        srt(lambda i: max(pieces[i].w, pieces[i].h), True),       # max side ↓
        srt(lambda i: min(pieces[i].w, pieces[i].h), True),       # min side ↓
        srt(lambda i: min(pieces[i].w, pieces[i].h)),              # min side ↑
        srt(lambda i: pieces[i].w + pieces[i].h, True),           # perimeter ↓
        srt(lambda i: pieces[i].w, True),                          # width ↓
        srt(lambda i: pieces[i].h, True),                          # height ↓
        srt(lambda i: pieces[i].w / max(pieces[i].h, 1), True),   # ratio ↓
        srt(lambda i: pieces[i].w / max(pieces[i].h, 1)),          # ratio ↑
    ]
    while len(population) < pop_size:
        o = idx[:]
        random.shuffle(o)
        population.append(o)

    # ── Evaluate initial population (fast) ────────────────────────────────
    fitness = [_fitness(o, pieces, board_w, board_h, kerf, fast=True) for o in population]

    # Best result: run ALL configs on the 10 deterministic orderings
    best: Optional[OptimizationResult] = None
    for o in population[:10]:
        r = _best_of_configs([pieces[i] for i in o], board_w, board_h, kerf)
        if r and _is_better(r, best):
            best = r

    elitism = max(2, pop_size // 10)

    # ── Evolve ────────────────────────────────────────────────────────────
    while time.time() < deadline:
        # Tournament selection
        new_pop = []
        for _ in range(pop_size):
            contestants = random.sample(range(pop_size), min(3, pop_size))
            winner = min(contestants, key=lambda i: (fitness[i][0], -fitness[i][1]))
            new_pop.append(population[winner][:])

        # Crossover + dual mutation
        offspring: List[List[int]] = []
        for i in range(0, len(new_pop) - 1, 2):
            if random.random() < 0.80:
                c1 = _ox_crossover(new_pop[i], new_pop[i + 1])
                c2 = _ox_crossover(new_pop[i + 1], new_pop[i])
            else:
                c1, c2 = new_pop[i][:], new_pop[i + 1][:]
            c1 = _swap_mutate(_inversion_mutate(c1, 0.15), 0.05)
            c2 = _swap_mutate(_inversion_mutate(c2, 0.15), 0.05)
            offspring.extend([c1, c2])

        # Evaluate offspring (fast fitness)
        off_fitness = [_fitness(o, pieces, board_w, board_h, kerf, fast=True) for o in offspring]

        # Deep-evaluate the top 5 offspring with ALL configs
        ranked = sorted(zip(offspring, off_fitness), key=lambda x: (x[1][0], -x[1][1]))
        for o, _ in ranked[:5]:
            r = _best_of_configs([pieces[i] for i in o], board_w, board_h, kerf)
            if r and _is_better(r, best):
                best = r

        # Elitism + generational replacement
        combined = sorted(
            zip(population + offspring, fitness + off_fitness),
            key=lambda x: (x[1][0], -x[1][1])
        )
        population = [x[0] for x in combined[:pop_size]]
        fitness    = [x[1] for x in combined[:pop_size]]

    # ── Final sweep: try ALL configs on the top 5 survivors ───────────────
    for o in population[:5]:
        r = _best_of_configs([pieces[i] for i in o], board_w, board_h, kerf)
        if r and _is_better(r, best):
            best = r

    if best is None:
        raise ValueError(
            "No se encontró una solución válida. "
            "Verificá que todas las piezas entren en la plancha."
        )

    return best
