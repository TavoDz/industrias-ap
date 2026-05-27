"""
Advanced industrial cutting optimizer engine.
Passes:
  1. Exhaustive greedy (16 orderings × 13 algorithms)
  2. Direct-pack (try N boards explicitly)
  3. Genetic Algorithm (PMX+OX, adaptive mutation, elite preservation)
  4. 2-opt local search on best GA individual
  5. Per-board re-packing
  6. Compaction (sparsest board → others)
  7. Reinsertion local search
  8. Final re-pack + cut lines
"""
from __future__ import annotations
import time
import random
from typing import List, Optional, Tuple

from .domain import (Piece, PlacedPiece, BoardResult, FreeSpace,
                     CutLine, OptimizationMetrics)
from .algorithms import (MaxRectsSheet, ALL_CONFIGS, FAST_CONFIGS,
                          create_sheet)


# ─────────────────────────────────────────────────────────────────────────────
# Scoring  (lower = better)
# ─────────────────────────────────────────────────────────────────────────────

def _score_boards(boards: List[BoardResult]) -> float:
    if not boards:
        return float('inf')
    total_area = sum(b.total_area for b in boards)
    used_area  = sum(b.area_used  for b in boards)
    waste      = (total_area - used_area) / total_area if total_area > 0 else 1.0
    n_boards   = len(boards)
    avg_frag   = sum(len(b.free_spaces) for b in boards) / n_boards / 10.0
    return waste * 0.50 + (n_boards / 100.0) * 0.40 + min(avg_frag, 1.0) * 0.10


def _is_better(a: List[BoardResult], b: Optional[List[BoardResult]]) -> bool:
    if b is None:
        return True
    if len(a) != len(b):
        return len(a) < len(b)
    return _score_boards(a) < _score_boards(b)


# ─────────────────────────────────────────────────────────────────────────────
# Single-config packing run
# ─────────────────────────────────────────────────────────────────────────────

def _run(pieces: List[Piece], bw: float, bh: float, kerf: float,
         algo: str, variant: str) -> Optional[List[BoardResult]]:
    boards: List[BoardResult] = []
    sheet = create_sheet(algo, variant, bw, bh, kerf)

    for piece in pieces:
        if sheet.try_place(piece) is not None:
            continue
        if sheet.placed:
            boards.append(BoardResult(number=len(boards) + 1, board_w=bw, board_h=bh,
                                      pieces=list(sheet.placed),
                                      free_spaces=sheet.get_free_spaces()))
        sheet = create_sheet(algo, variant, bw, bh, kerf)
        if sheet.try_place(piece) is None:
            return None

    if sheet.placed:
        boards.append(BoardResult(number=len(boards) + 1, board_w=bw, board_h=bh,
                                  pieces=list(sheet.placed),
                                  free_spaces=sheet.get_free_spaces()))
    return boards if boards else None


def _best_of(pieces: List[Piece], bw: float, bh: float, kerf: float,
             configs=ALL_CONFIGS) -> Optional[List[BoardResult]]:
    best = None
    for algo, variant in configs:
        r = _run(pieces, bw, bh, kerf, algo, variant)
        if r and _is_better(r, best):
            best = r
    return best


# ─────────────────────────────────────────────────────────────────────────────
# Orderings  (16 deterministic)
# ─────────────────────────────────────────────────────────────────────────────

def _orderings(pieces: List[Piece]) -> List[List[Piece]]:
    def srt(key, rev=False): return sorted(pieces, key=key, reverse=rev)
    return [
        srt(lambda p: p.area, True),
        srt(lambda p: p.area),
        srt(lambda p: p.max_dim, True),
        srt(lambda p: p.max_dim),
        srt(lambda p: p.min_dim, True),
        srt(lambda p: p.min_dim),
        srt(lambda p: p.perimeter, True),
        srt(lambda p: p.perimeter),
        srt(lambda p: p.width, True),
        srt(lambda p: p.height, True),
        srt(lambda p: p.width / max(p.height, 1), True),
        srt(lambda p: p.width / max(p.height, 1)),
        srt(lambda p: p.height / max(p.width, 1), True),
        srt(lambda p: p.area * p.max_dim, True),
        srt(lambda p: p.area * p.min_dim, True),
        pieces[:],
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Sheet reconstruction
# ─────────────────────────────────────────────────────────────────────────────

def _rebuild_sheet(board: BoardResult, bw: float, bh: float, kerf: float) -> MaxRectsSheet:
    sheet = MaxRectsSheet(bw, bh, kerf, 'BAF')
    for pp in sorted(board.pieces, key=lambda p: (p.y, p.x)):
        sheet.force_place(pp.x, pp.y, pp.width, pp.height,
                          piece_id=pp.piece_id, name=pp.name,
                          rotated=pp.rotated, can_rotate=pp.can_rotate,
                          grain_direction=pp.grain_direction)
    return sheet


# ─────────────────────────────────────────────────────────────────────────────
# Strip-based assignment  (groups pieces by height into rows per board)
# ─────────────────────────────────────────────────────────────────────────────

def _strip_assign(pieces: List[Piece], bw: float, bh: float,
                  kerf: float, n: int) -> List[List[Piece]]:
    """Assign pieces to boards by grouping them into horizontal strips."""
    sorted_p = sorted(pieces, key=lambda p: p.height, reverse=True)
    groups: List[List[Piece]] = [[] for _ in range(n)]
    board_h_used = [0.0] * n

    strip: List[Piece] = []
    strip_h = 0.0
    strip_w = 0.0

    def flush(s, sh):
        if not s:
            return
        idx = min(range(n), key=lambda i: board_h_used[i])
        groups[idx].extend(s)
        board_h_used[idx] += sh + kerf

    for p in sorted_p:
        if strip and (abs(p.height - strip_h) > 60 or
                      strip_w + p.width + kerf > bw):
            flush(strip, strip_h)
            strip, strip_h, strip_w = [], 0.0, 0.0
        strip.append(p)
        strip_h = max(strip_h, p.height)
        strip_w += p.width + kerf

    flush(strip, strip_h)
    return groups


# ─────────────────────────────────────────────────────────────────────────────
# Fast packing check  (3 orderings × 5 fast configs per board)
# ─────────────────────────────────────────────────────────────────────────────

_QUICK_ORDERINGS = [
    lambda g: sorted(g, key=lambda p: p.area,    reverse=True),
    lambda g: sorted(g, key=lambda p: p.height,  reverse=True),
    lambda g: sorted(g, key=lambda p: p.max_dim, reverse=True),
    lambda g: sorted(g, key=lambda p: p.width,   reverse=True),
    lambda g: sorted(g, key=lambda p: p.area * p.max_dim, reverse=True),
]


def _pack_board_quick(group: List[Piece], bw: float, bh: float,
                      kerf: float) -> Optional[List[PlacedPiece]]:
    best_placed: Optional[List[PlacedPiece]] = None
    best_used = 0.0
    for ord_fn in _QUICK_ORDERINGS:
        for algo, variant in FAST_CONFIGS:
            sheet = create_sheet(algo, variant, bw, bh, kerf)
            ok = True
            for p in ord_fn(group):
                if sheet.try_place(p) is None:
                    ok = False
                    break
            if ok and sheet.area_used > best_used:
                best_used   = sheet.area_used
                best_placed = list(sheet.placed)
    return best_placed


def _pack_assignment_quick(groups: List[List[Piece]], bw: float, bh: float,
                            kerf: float) -> Optional[List[BoardResult]]:
    result: List[BoardResult] = []
    for i, group in enumerate(groups):
        if not group:
            continue
        placed = _pack_board_quick(group, bw, bh, kerf)
        if placed is None:
            return None
        result.append(BoardResult(number=i + 1, board_w=bw, board_h=bh,
                                  pieces=placed, free_spaces=[]))
    return result if result else None


# ─────────────────────────────────────────────────────────────────────────────
# Per-board re-packing
# ─────────────────────────────────────────────────────────────────────────────

def _force_strip_layout(orig: List[Piece], bw: float, bh: float,
                         kerf: float) -> Optional[List[PlacedPiece]]:
    """
    Place pieces in clean horizontal strips sorted by height descending.
    Within each strip, pieces are placed left-to-right.
    This is the most visually organized layout for carpentry.
    """
    # Sort: height desc, width desc within same height bucket (±30mm)
    buckets: dict = {}
    for p in orig:
        bucket = round(p.height / 30) * 30
        buckets.setdefault(bucket, []).append(p)

    ordered: List[Piece] = []
    for bk in sorted(buckets.keys(), reverse=True):
        ordered.extend(sorted(buckets[bk], key=lambda p: p.width, reverse=True))

    placed: List[PlacedPiece] = []
    x, y   = 0.0, 0.0
    row_h  = 0.0

    for p in ordered:
        # Start new row if piece doesn't fit horizontally
        if x > 0 and x + p.width + kerf > bw:
            y    += row_h + kerf
            x     = 0.0
            row_h = 0.0

        if y + p.height > bh + 0.5:
            return None  # Doesn't fit vertically — fall back to algorithm

        placed.append(PlacedPiece(
            piece_id=p.id, name=p.name,
            x=round(x, 2), y=round(y, 2),
            width=p.width, height=p.height,
            rotated=False,
            original_width=p.width, original_height=p.height,
            can_rotate=p.can_rotate, grain_direction=p.grain_direction,
            edge_banding=p.edge_banding,
        ))
        row_h  = max(row_h, p.height)
        x     += p.width + kerf

    return placed


def _repack_board(board: BoardResult, bw: float, bh: float, kerf: float) -> BoardResult:
    """
    Re-pack a board using the most organized layout possible.
    Priority: strip layout → shelf → skyline → guillotine → maxrects.
    """
    orig = [pp.to_original_piece() for pp in board.pieces]

    # ── 1st choice: custom strip layout (most organized) ──────────────────────
    strip = _force_strip_layout(orig, bw, bh, kerf)
    if strip is not None:
        return BoardResult(number=board.number, board_w=bw, board_h=bh,
                           pieces=strip, free_spaces=[])

    # ── 2nd+: algorithm fallback in priority order ────────────────────────────
    priority = [
        ('shelf',      ''),
        ('skyline',    ''),
        ('guillotine', 'SAS'),  ('guillotine', 'LAS'),
        ('guillotine', 'SLAS'), ('guillotine', 'LLAS'),
        ('guillotine', 'MAXAS'),('guillotine', 'MINAS'),
        ('maxrects',   'BL'),   ('maxrects',   'BAF'),
        ('maxrects',   'BSSF'), ('maxrects',   'BLSF'),
        ('maxrects',   'CP'),
    ]
    height_sorted = sorted(orig, key=lambda p: p.height, reverse=True)

    for algo, variant in priority:
        sheet = create_sheet(algo, variant, bw, bh, kerf)
        all_fit = True
        for p in height_sorted:
            if sheet.try_place(p) is None:
                all_fit = False
                break
        if all_fit:
            return BoardResult(number=board.number, board_w=bw, board_h=bh,
                               pieces=list(sheet.placed), free_spaces=[])

    # ── Last resort: try all orderings × all configs ──────────────────────────
    best_placed = board.pieces
    best_used   = board.area_used
    for ordering in _orderings(orig):
        for algo, variant in ALL_CONFIGS:
            sheet = create_sheet(algo, variant, bw, bh, kerf)
            ok = all(sheet.try_place(p) is not None for p in ordering)
            if ok and sheet.area_used > best_used:
                best_used   = sheet.area_used
                best_placed = list(sheet.placed)

    return BoardResult(number=board.number, board_w=bw, board_h=bh,
                       pieces=best_placed, free_spaces=[])


def _repack_boards(boards: List[BoardResult], bw: float, bh: float, kerf: float) -> List[BoardResult]:
    return [_repack_board(b, bw, bh, kerf) for b in boards]


# ─────────────────────────────────────────────────────────────────────────────
# Direct-pack: assign pieces to exactly N boards and pack each board optimally
# ─────────────────────────────────────────────────────────────────────────────

def _pack_assignment(groups: List[List[Piece]], bw: float, bh: float,
                     kerf: float) -> Optional[List[BoardResult]]:
    """Pack each group independently; return None if any group fails."""
    result = []
    for i, group in enumerate(groups):
        if not group:
            continue
        best = None
        best_used = -1.0
        for ordering in _orderings(group):
            for algo, variant in ALL_CONFIGS:
                sheet = create_sheet(algo, variant, bw, bh, kerf)
                all_fit = True
                for p in ordering:
                    if sheet.try_place(p) is None:
                        all_fit = False
                        break
                if all_fit and sheet.area_used > best_used:
                    best_used = sheet.area_used
                    best = list(sheet.placed)
        if best is None:
            return None
        result.append(BoardResult(number=i + 1, board_w=bw, board_h=bh,
                                  pieces=best, free_spaces=[]))
    return result if result else None


def _bfd_assign(pieces: List[Piece], n: int) -> List[List[Piece]]:
    """Least-Full assignment (balances area across n boards)."""
    groups: List[List[Piece]] = [[] for _ in range(n)]
    totals = [0.0] * n
    for p in pieces:
        idx = min(range(n), key=lambda i: totals[i])
        groups[idx].append(p)
        totals[idx] += p.area
    return groups


def _direct_pack(pieces: List[Piece], bw: float, bh: float,
                 kerf: float, n_boards: int,
                 time_budget: float = 15.0) -> Optional[List[BoardResult]]:
    """
    Time-bounded search: tries hundreds of assignments to pack all pieces
    into exactly n_boards boards. Uses quick packing check for screening,
    then full check on the best candidate found.
    """
    t0 = time.time()
    if sum(p.area for p in pieces) > n_boards * bw * bh:
        return None

    best: Optional[List[BoardResult]] = None

    def try_quick(groups: List[List[Piece]]) -> bool:
        nonlocal best
        r = _pack_assignment_quick(groups, bw, bh, kerf)
        if r and _is_better(r, best):
            best = r
        return r is not None

    # ── Phase A: deterministic BFD with all 16 orderings ─────────────────────
    for ordering in _orderings(pieces):
        if time.time() - t0 > time_budget * 0.25:
            break
        try_quick(_bfd_assign(ordering, n_boards))

    # ── Phase B: round-robin with multiple sort keys ──────────────────────────
    rr_keys = [
        (lambda p: p.area,          True),
        (lambda p: p.height,        True),
        (lambda p: p.width,         True),
        (lambda p: p.max_dim,       True),
        (lambda p: p.min_dim,       True),
        (lambda p: p.area*p.max_dim, True),
        (lambda p: p.height/max(p.width,1), True),
    ]
    for key_fn, rev in rr_keys:
        if time.time() - t0 > time_budget * 0.35:
            break
        sorted_p = sorted(pieces, key=key_fn, reverse=rev)
        groups = [[] for _ in range(n_boards)]
        for i, p in enumerate(sorted_p):
            groups[i % n_boards].append(p)
        try_quick(groups)

    # ── Phase C: strip-based assignment ──────────────────────────────────────
    if time.time() - t0 < time_budget * 0.40:
        try_quick(_strip_assign(pieces, bw, bh, kerf, n_boards))

    # ── Phase D: massive random BFD search ───────────────────────────────────
    while time.time() - t0 < time_budget:
        p_shuffled = pieces[:]
        random.shuffle(p_shuffled)
        try_quick(_bfd_assign(p_shuffled, n_boards))

    # ── Phase E: full repack of the best quick candidate ─────────────────────
    if best is not None:
        groups_from_best = [[pp.to_original_piece() for pp in b.pieces]
                            for b in best]
        full = _pack_assignment(groups_from_best, bw, bh, kerf)
        if full and _is_better(full, best):
            best = full

    return best


# ─────────────────────────────────────────────────────────────────────────────
# GA helpers
# ─────────────────────────────────────────────────────────────────────────────

def _fitness(order: List[int], pieces: List[Piece],
             bw: float, bh: float, kerf: float) -> float:
    ordered = [pieces[i] for i in order]
    best = None
    for algo, variant in FAST_CONFIGS:
        r = _run(ordered, bw, bh, kerf, algo, variant)
        if r and _is_better(r, best):
            best = r
    return _score_boards(best) if best else float('inf')


def _ox(p1: List[int], p2: List[int]) -> List[int]:
    """Order Crossover."""
    n = len(p1)
    if n <= 2:
        return p1[:]
    a, b = sorted(random.sample(range(n), 2))
    child: List[Optional[int]] = [None] * n
    child[a:b] = p1[a:b]
    seg = set(p1[a:b])
    pool = [x for x in p2 if x not in seg]
    j = 0
    for i in range(n):
        if child[i] is None:
            child[i] = pool[j]
            j += 1
    return child  # type: ignore


def _pmx(p1: List[int], p2: List[int]) -> List[int]:
    """Partially Mapped Crossover."""
    n = len(p1)
    if n <= 2:
        return p1[:]
    a, b = sorted(random.sample(range(n), 2))
    child = list(p2)
    for i in range(a, b):
        child[i] = p1[i]
    # Fix duplicates outside the segment
    seg_vals = set(p1[a:b])
    for i in range(n):
        if a <= i < b:
            continue
        v = child[i]
        seen: set = set()
        while v in seg_vals and v not in seen:
            seen.add(v)
            pos = p1.index(v)
            v = p2[pos]
        child[i] = v
    return child


def _mutate(order: List[int], rate: float = 0.05) -> List[int]:
    o = order[:]
    n = len(o)
    # Swap mutation
    for i in range(n):
        if random.random() < rate:
            j = random.randint(0, n - 1)
            o[i], o[j] = o[j], o[i]
    # Inversion mutation
    if n >= 2 and random.random() < 0.15:
        a, b = sorted(random.sample(range(n), 2))
        o[a:b + 1] = o[a:b + 1][::-1]
    # Insert mutation
    if n >= 3 and random.random() < 0.10:
        i = random.randint(0, n - 1)
        j = random.randint(0, n - 1)
        v = o.pop(i)
        o.insert(j, v)
    return o


# ─────────────────────────────────────────────────────────────────────────────
# 2-opt local search on ordering
# ─────────────────────────────────────────────────────────────────────────────

def _two_opt(order: List[int], pieces: List[Piece],
             bw: float, bh: float, kerf: float,
             time_budget: float) -> Tuple[List[int], float]:
    """Improve a permutation with pairwise swaps until no improvement or time up."""
    n   = len(order)
    cur = _fitness(order, pieces, bw, bh, kerf)
    t0  = time.time()

    improved = True
    while improved and time.time() - t0 < time_budget:
        improved = False
        for i in range(n - 1):
            if time.time() - t0 > time_budget:
                break
            for j in range(i + 1, n):
                new_order      = order[:]
                new_order[i], new_order[j] = new_order[j], new_order[i]
                new_fit        = _fitness(new_order, pieces, bw, bh, kerf)
                if new_fit < cur:
                    order    = new_order
                    cur      = new_fit
                    improved = True
    return order, cur


# ─────────────────────────────────────────────────────────────────────────────
# Compaction: eliminate the sparsest board
# ─────────────────────────────────────────────────────────────────────────────

def _compact_all(boards: List[BoardResult], bw: float, bh: float, kerf: float) -> List[BoardResult]:
    """Repeatedly eliminate the board with the least area used."""
    while len(boards) > 1:
        target_idx    = min(range(len(boards)), key=lambda i: boards[i].area_used)
        others        = [b for i, b in enumerate(boards) if i != target_idx]
        target_pieces = [pp.to_original_piece() for pp in boards[target_idx].pieces]

        orderings = [
            sorted(target_pieces, key=lambda p: p.area,    reverse=True),
            sorted(target_pieces, key=lambda p: p.max_dim, reverse=True),
            sorted(target_pieces, key=lambda p: p.min_dim, reverse=True),
            sorted(target_pieces, key=lambda p: p.perimeter, reverse=True),
            target_pieces[:],
        ]

        improved = False
        for ordering in orderings:
            sheets = [_rebuild_sheet(b, bw, bh, kerf) for b in others]
            ok = True
            for piece in ordering:
                placed = any(s.try_place(piece) is not None for s in sheets)
                if not placed:
                    ok = False
                    break
            if ok:
                boards = [
                    BoardResult(number=i + 1, board_w=bw, board_h=bh,
                                pieces=list(s.placed),
                                free_spaces=s.get_free_spaces())
                    for i, s in enumerate(sheets)
                ]
                improved = True
                break

        if not improved:
            break
    return boards


# ─────────────────────────────────────────────────────────────────────────────
# Reinsertion: move individual pieces from sparse board to others
# ─────────────────────────────────────────────────────────────────────────────

def _reinsertion_ls(boards: List[BoardResult], bw: float, bh: float, kerf: float) -> List[BoardResult]:
    """
    Move one piece at a time from the sparsest board into any other board.
    Eliminates the board when it empties. Repeats until no improvement.
    """
    changed = True
    while changed and len(boards) > 1:
        changed = False
        src_idx = min(range(len(boards)), key=lambda i: boards[i].area_used)
        src_pieces = list(boards[src_idx].pieces)

        for pi, pp in enumerate(src_pieces):
            piece = pp.to_original_piece()
            for dst_idx in range(len(boards)):
                if dst_idx == src_idx:
                    continue
                dst_sheet = _rebuild_sheet(boards[dst_idx], bw, bh, kerf)
                if dst_sheet.try_place(piece) is not None:
                    # Update dst
                    boards[dst_idx] = BoardResult(
                        number=boards[dst_idx].number, board_w=bw, board_h=bh,
                        pieces=list(dst_sheet.placed),
                        free_spaces=dst_sheet.get_free_spaces())
                    # Update src
                    remaining = [x for k, x in enumerate(src_pieces) if k != pi]
                    if remaining:
                        boards[src_idx] = BoardResult(
                            number=boards[src_idx].number, board_w=bw, board_h=bh,
                            pieces=remaining, free_spaces=[])
                        src_pieces = remaining
                    else:
                        boards = [b for i, b in enumerate(boards) if i != src_idx]
                        changed = True
                        break
                    changed = True
                    break
            if changed and (src_idx >= len(boards) or
                            boards[src_idx].area_used != sum(x.area for x in src_pieces)):
                break
    return boards


# ─────────────────────────────────────────────────────────────────────────────
# Cut line generation
# ─────────────────────────────────────────────────────────────────────────────

def _generate_cuts(pieces: List[PlacedPiece], bw: float, bh: float) -> List[CutLine]:
    cuts: List[CutLine] = []
    seq = 1

    y_vals = sorted({v for p in pieces for v in (p.y, p.bottom) if 0 < v < bh})
    for y in y_vals:
        cuts.append(CutLine(x1=0, y1=y, x2=bw, y2=y, direction='H', sequence=seq))
        seq += 1

    y_bounds = [0.0] + y_vals + [bh]
    for j in range(len(y_bounds) - 1):
        sy, ey = y_bounds[j], y_bounds[j + 1]
        strip  = [p for p in pieces if p.y <= sy + 0.1 and p.bottom >= ey - 0.1]
        x_vals = sorted({v for p in strip for v in (p.x, p.right) if 0 < v < bw})
        for x in x_vals:
            cuts.append(CutLine(x1=x, y1=sy, x2=x, y2=ey, direction='V', sequence=seq))
            seq += 1

    return cuts


# ─────────────────────────────────────────────────────────────────────────────
# Main engine
# ─────────────────────────────────────────────────────────────────────────────

class AdvancedEngine:

    def optimize(
        self,
        pieces: List[Piece],
        board_w: float,
        board_h: float,
        kerf: float = 3.0,
        time_limit: float = 45.0,
    ) -> Tuple[List[BoardResult], OptimizationMetrics]:

        t0 = time.time()
        passes = 0

        # ── Validate ──────────────────────────────────────────────────────────
        for p in pieces:
            fits   = (p.width <= board_w and p.height <= board_h)
            fits_r = p.can_rotate and (p.height <= board_w and p.width <= board_h)
            if not fits and not fits_r:
                raise ValueError(
                    f"Pieza '{p.name}' ({p.width}×{p.height}mm) no cabe "
                    f"en la plancha ({board_w}×{board_h}mm)."
                )

        # ── Pass 1: Exhaustive greedy (16 orderings × 13 algorithms) ──────────
        best: Optional[List[BoardResult]] = None
        for ordering in _orderings(pieces):
            r = _best_of(ordering, board_w, board_h, kerf)
            if r and _is_better(r, best):
                best = r
        passes += 1

        # ── Pass 2: Direct-pack (try lower_bound … greedy_count boards) ───────
        import math
        total_piece_area = sum(p.area for p in pieces)
        board_area       = board_w * board_h
        lower_bound      = math.ceil(total_piece_area / board_area)
        greedy_count     = len(best) if best else lower_bound + 5

        direct_budget = min(time_limit * 0.40, 20.0)  # up to 40% of time or 20s
        for n in range(lower_bound, greedy_count):
            r = _direct_pack(pieces, board_w, board_h, kerf, n,
                             time_budget=direct_budget)
            if r and _is_better(r, best):
                best = r
                break
        passes += 1

        # ── Pass 3: Genetic Algorithm ─────────────────────────────────────────
        n_pieces  = len(pieces)
        pop_size  = 100
        elite_sz  = 4
        id_to_idx = {p.id: i for i, p in enumerate(pieces)}
        idx       = list(range(n_pieces))

        # Seed from deterministic orderings
        population: List[List[int]] = []
        for ordering in _orderings(pieces):
            population.append([id_to_idx[p.id] for p in ordering])
        while len(population) < pop_size:
            o = idx[:]
            random.shuffle(o)
            population.append(o)

        fitness = [_fitness(o, pieces, board_w, board_h, kerf) for o in population]

        # Deep-evaluate top 12 initial individuals
        for o, _ in sorted(zip(population, fitness), key=lambda x: x[1])[:12]:
            ordered = [pieces[i] for i in o]
            r = _best_of(ordered, board_w, board_h, kerf, ALL_CONFIGS)
            if r and _is_better(r, best):
                best = r

        ga_deadline = t0 + time_limit * 0.90
        mut_rate    = 0.05

        while time.time() < ga_deadline:
            prev_score = _score_boards(best) if best else float('inf')

            # Preserve elite
            elite     = [o[:] for o in population[:elite_sz]]
            elite_fit = fitness[:elite_sz]

            # Tournament selection (size 4)
            new_pop: List[List[int]] = []
            for _ in range(pop_size - elite_sz):
                c      = random.sample(range(pop_size), min(4, pop_size))
                winner = min(c, key=lambda i: fitness[i])
                new_pop.append(population[winner][:])

            # Crossover (50% OX, 50% PMX) + mutation
            offspring: List[List[int]] = []
            for i in range(0, len(new_pop) - 1, 2):
                if random.random() < 0.80:
                    if random.random() < 0.5:
                        c1 = _ox(new_pop[i], new_pop[i + 1])
                        c2 = _ox(new_pop[i + 1], new_pop[i])
                    else:
                        c1 = _pmx(new_pop[i], new_pop[i + 1])
                        c2 = _pmx(new_pop[i + 1], new_pop[i])
                else:
                    c1, c2 = new_pop[i][:], new_pop[i + 1][:]
                offspring.extend([_mutate(c1, mut_rate), _mutate(c2, mut_rate)])
            if len(new_pop) % 2 == 1:
                offspring.append(_mutate(new_pop[-1], mut_rate))

            off_fit = [_fitness(o, pieces, board_w, board_h, kerf) for o in offspring]

            # Deep-evaluate top 10 offspring
            for o, _ in sorted(zip(offspring, off_fit), key=lambda x: x[1])[:10]:
                ordered = [pieces[i] for i in o]
                r = _best_of(ordered, board_w, board_h, kerf, ALL_CONFIGS)
                if r and _is_better(r, best):
                    best = r

            # Adaptive mutation
            new_score = _score_boards(best) if best else float('inf')
            if new_score < prev_score:
                mut_rate = max(0.02, mut_rate * 0.90)
            else:
                mut_rate = min(0.25, mut_rate * 1.15)

            # Elitist replacement
            combined   = sorted(zip(elite + offspring, elite_fit + off_fit),
                                 key=lambda x: x[1])
            population = [x[0] for x in combined[:pop_size]]
            fitness    = [x[1] for x in combined[:pop_size]]

        passes += 1

        # Final sweep on top 5 survivors
        for o in population[:5]:
            ordered = [pieces[i] for i in o]
            r = _best_of(ordered, board_w, board_h, kerf, ALL_CONFIGS)
            if r and _is_better(r, best):
                best = r

        # ── Pass 4: 2-opt local search on best GA individual ─────────────────
        remaining_budget = max(0.0, time_limit - (time.time() - t0))
        if population and remaining_budget > 1.0:
            imp_ind, _ = _two_opt(population[0], pieces, board_w, board_h, kerf,
                                   remaining_budget * 0.60)
            r = _best_of([pieces[i] for i in imp_ind], board_w, board_h, kerf, ALL_CONFIGS)
            if r and _is_better(r, best):
                best = r
        passes += 1

        if best is None:
            raise ValueError("No se encontró solución. Verificá que todas las piezas quepan en la plancha.")

        # ── Pass 5: Per-board re-packing ──────────────────────────────────────
        best = _repack_boards(best, board_w, board_h, kerf)
        passes += 1

        # ── Pass 6: Compaction (sparsest board → others) ──────────────────────
        before = len(best)
        best   = _compact_all(best, board_w, board_h, kerf)
        if len(best) < before:
            passes += 1
            best = _repack_boards(best, board_w, board_h, kerf)

        # ── Pass 7: Reinsertion local search ──────────────────────────────────
        before = len(best)
        best   = _reinsertion_ls(best, board_w, board_h, kerf)
        if len(best) < before:
            passes += 1
            best = _repack_boards(best, board_w, board_h, kerf)

        # ── Pass 8: Cut lines + free spaces ───────────────────────────────────
        renumbered = []
        for i, board in enumerate(best):
            board.number = i + 1
            board.cut_lines = _generate_cuts(board.pieces, board_w, board_h)
            if not board.free_spaces:
                sheet = MaxRectsSheet(board_w, board_h, kerf, 'BAF')
                for pp in sorted(board.pieces, key=lambda p: (p.y, p.x)):
                    sheet.force_place(pp.x, pp.y, pp.width, pp.height)
                board.free_spaces = sheet.get_free_spaces()
            renumbered.append(board)
        best = renumbered
        passes += 1

        elapsed = time.time() - t0

        # ── Metrics ───────────────────────────────────────────────────────────
        total_area = len(best) * board_area
        used_area  = sum(b.area_used for b in best)
        waste_area = total_area - used_area
        efficiency = used_area / total_area * 100 if total_area > 0 else 0.0
        all_cuts   = [cl for b in best for cl in b.cut_lines]
        cut_m      = sum(cl.length for cl in all_cuts) / 1000.0
        MIN_OFFCUT = 200.0 * 200.0
        reusable   = sum(1 for b in best for fs in b.free_spaces if fs.area >= MIN_OFFCUT)
        avg_fs     = sum(len(b.free_spaces) for b in best) / len(best)
        frag       = min(avg_fs / 15.0, 1.0)

        metrics = OptimizationMetrics(
            boards_used=len(best),
            efficiency_percent=round(efficiency, 2),
            waste_percent=round(100 - efficiency, 2),
            area_used=round(used_area, 2),
            area_total=round(total_area, 2),
            area_wasted=round(waste_area, 2),
            total_cuts=len(all_cuts),
            cut_meters=round(cut_m, 3),
            reusable_offcuts=reusable,
            fragmentation_index=round(frag, 4),
            score=round(_score_boards(best), 6),
            algorithm="MaxRects(5)+Guillotine(6)+Skyline+Shelf+DirectPack+GA(PMX+OX)+2opt+Repack+Reinsertion",
            passes_run=passes,
            time_ms=int(elapsed * 1000),
        )

        return best, metrics
