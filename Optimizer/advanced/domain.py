"""
Domain models for the advanced cutting optimizer.
Internal representation — independent of any external format.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class EdgeBanding:
    top: bool = False
    bottom: bool = False
    left: bool = False
    right: bool = False
    material_id: Optional[str] = None

    @classmethod
    def from_flags(cls, value: int) -> "EdgeBanding":
        return cls(
            top=bool(value & 1),
            bottom=bool(value & 2),
            left=bool(value & 4),
            right=bool(value & 8),
        )

    def to_flags(self) -> int:
        return (int(self.top) | (int(self.bottom) << 1) |
                (int(self.left) << 2) | (int(self.right) << 3))

    def rotate_cw(self) -> "EdgeBanding":
        """90° clockwise: left→top, top→right, right→bottom, bottom→left"""
        return EdgeBanding(top=self.left, right=self.top, bottom=self.right, left=self.bottom)

    def rotate_ccw(self) -> "EdgeBanding":
        """90° counter-clockwise (inverse of rotate_cw)"""
        return EdgeBanding(top=self.right, right=self.bottom, bottom=self.left, left=self.top)

    def sides_count(self) -> int:
        return sum([self.top, self.bottom, self.left, self.right])


@dataclass
class Piece:
    id: str
    name: str
    width: float
    height: float
    quantity: int = 1
    can_rotate: bool = True
    grain_direction: bool = False
    material_id: str = ""
    edge_banding: EdgeBanding = field(default_factory=EdgeBanding)
    priority: int = 0

    @property
    def area(self) -> float: return self.width * self.height

    @property
    def max_dim(self) -> float: return max(self.width, self.height)

    @property
    def min_dim(self) -> float: return min(self.width, self.height)

    @property
    def perimeter(self) -> float: return 2 * (self.width + self.height)


@dataclass
class PlacedPiece:
    piece_id: str
    name: str
    x: float
    y: float
    width: float
    height: float
    rotated: bool
    original_width: float = 0.0
    original_height: float = 0.0
    can_rotate: bool = True
    grain_direction: bool = False
    edge_banding: EdgeBanding = field(default_factory=EdgeBanding)

    @property
    def area(self) -> float: return self.width * self.height

    @property
    def right(self) -> float: return self.x + self.width

    @property
    def bottom(self) -> float: return self.y + self.height

    def to_original_piece(self) -> Piece:
        """Reconstruct the original Piece before placement/rotation."""
        eb = self.edge_banding.rotate_ccw() if self.rotated else self.edge_banding
        return Piece(
            id=self.piece_id, name=self.name,
            width=self.original_width, height=self.original_height,
            can_rotate=self.can_rotate,
            grain_direction=self.grain_direction,
            edge_banding=eb,
        )


@dataclass
class FreeSpace:
    x: float
    y: float
    width: float
    height: float

    @property
    def area(self) -> float: return self.width * self.height

    @property
    def right(self) -> float: return self.x + self.width

    @property
    def bottom(self) -> float: return self.y + self.height

    @property
    def aspect_ratio(self) -> float:
        if min(self.width, self.height) == 0: return 0.0
        return min(self.width, self.height) / max(self.width, self.height)

    @property
    def quality(self) -> float:
        """High area + square shape = higher quality remnant."""
        return self.aspect_ratio * self.area


@dataclass
class CutLine:
    x1: float
    y1: float
    x2: float
    y2: float
    direction: str  # 'H' (horizontal) or 'V' (vertical)
    sequence: int = 0

    @property
    def length(self) -> float:
        return abs(self.x2 - self.x1) + abs(self.y2 - self.y1)


@dataclass
class BoardResult:
    number: int
    board_w: float
    board_h: float
    pieces: List[PlacedPiece] = field(default_factory=list)
    free_spaces: List[FreeSpace] = field(default_factory=list)
    cut_lines: List[CutLine] = field(default_factory=list)

    @property
    def area_used(self) -> float:
        return sum(p.area for p in self.pieces)

    @property
    def total_area(self) -> float:
        return self.board_w * self.board_h

    @property
    def efficiency(self) -> float:
        return self.area_used / self.total_area if self.total_area > 0 else 0.0

    @property
    def waste(self) -> float:
        return 1.0 - self.efficiency


@dataclass
class OptimizationMetrics:
    boards_used: int
    efficiency_percent: float
    waste_percent: float
    area_used: float
    area_total: float
    area_wasted: float
    total_cuts: int
    cut_meters: float
    reusable_offcuts: int
    fragmentation_index: float
    score: float
    algorithm: str
    passes_run: int
    time_ms: int
