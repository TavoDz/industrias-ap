"""
Industrias AP — Optimizer Microservice
FastAPI endpoint que expone el optimizador 2D avanzado.
Puerto: 8001
Endpoints:
  POST /optimize          — motor original (MaxRects+Guillotine+GA)
  POST /optimize/advanced — motor industrial (13 algoritmos+GA+Compaction)
"""

import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from optimizer import optimize, PieceInput, OptimizationResult
from advanced.engine import AdvancedEngine
from advanced.domain import Piece, EdgeBanding

# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Industrias AP — Optimizer Service",
    version="2.0",
    description="Advanced 2D cutting optimizer: MaxRects + Guillotine + Genetic Algorithm",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────────────────────────────────────

class PieceRequest(BaseModel):
    id: int
    name: str
    w: float          # largo (mm)
    h: float          # ancho (mm)
    can_rotate: bool = True
    quantity: int = 1

    @field_validator('w', 'h')
    @classmethod
    def positive(cls, v):
        if v <= 0:
            raise ValueError("Las dimensiones deben ser mayores a 0")
        return v

    @field_validator('quantity')
    @classmethod
    def positive_qty(cls, v):
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class OptimizeRequest(BaseModel):
    board_w: float       # ancho de la plancha (mm)
    board_h: float       # alto de la plancha (mm)
    kerf: float = 3.0   # espesor de sierra (mm)
    time_limit: float = 25.0
    pieces: List[PieceRequest]


class PlacedPieceOut(BaseModel):
    piece_id: int
    name: str
    x: float
    y: float
    w: float
    h: float
    rotated: bool


class BoardOut(BaseModel):
    number: int
    pieces: List[PlacedPieceOut]


class OptimizeResponse(BaseModel):
    boards_used: int
    efficiency_percent: float
    area_used: float
    area_total: float
    area_wasted: float
    algorithm: str
    time_ms: int
    boards: List[BoardOut]


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "Industrias AP Optimizer v3.0"}


# ─────────────────────────────────────────────────────────────────────────────
# Advanced optimizer — request / response models
# ─────────────────────────────────────────────────────────────────────────────

class AdvPieceReq(BaseModel):
    id: str = ""
    name: str
    width: float
    height: float
    quantity: int = 1
    can_rotate: bool = True
    grain_direction: bool = False
    edge_top: bool = False
    edge_bottom: bool = False
    edge_left: bool = False
    edge_right: bool = False
    edge_flags: int = 0  # Lepton binary flags (overrides individual bools if > 0)

    @field_validator('width', 'height')
    @classmethod
    def positive_dim(cls, v):
        if v <= 0: raise ValueError("Dimensión debe ser > 0")
        return v

    @field_validator('quantity')
    @classmethod
    def positive_qty(cls, v):
        if v <= 0: raise ValueError("Cantidad debe ser > 0")
        return v


class AdvRequest(BaseModel):
    board_w: float
    board_h: float
    kerf: float = 3.0
    time_limit: float = 45.0
    pieces: List[AdvPieceReq]


class AdvPlacedPieceOut(BaseModel):
    piece_id: str
    name: str
    x: float; y: float
    width: float; height: float
    rotated: bool
    original_width: float; original_height: float
    edge_top: bool; edge_bottom: bool; edge_left: bool; edge_right: bool


class AdvFreeSpaceOut(BaseModel):
    x: float; y: float; width: float; height: float; area: float


class AdvCutLineOut(BaseModel):
    x1: float; y1: float; x2: float; y2: float
    direction: str; sequence: int; length: float


class AdvBoardOut(BaseModel):
    number: int
    efficiency: float
    area_used: float
    pieces: List[AdvPlacedPieceOut]
    free_spaces: List[AdvFreeSpaceOut]
    cut_lines: List[AdvCutLineOut]


class AdvResponse(BaseModel):
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
    boards: List[AdvBoardOut]


# ─────────────────────────────────────────────────────────────────────────────
# Advanced endpoint
# ─────────────────────────────────────────────────────────────────────────────

_engine = AdvancedEngine()


@app.post("/optimize/advanced", response_model=AdvResponse)
def optimize_advanced(req: AdvRequest):
    t0 = time.time()

    # Build domain pieces
    all_pieces: List[Piece] = []
    for i, p in enumerate(req.pieces):
        pid = p.id if p.id else str(i)
        if p.edge_flags > 0:
            eb = EdgeBanding.from_flags(p.edge_flags)
        else:
            eb = EdgeBanding(top=p.edge_top, bottom=p.edge_bottom,
                             left=p.edge_left, right=p.edge_right)
        for q in range(p.quantity):
            all_pieces.append(Piece(
                id=f"{pid}_{q}",
                name=p.name,
                width=p.width,
                height=p.height,
                can_rotate=p.can_rotate,
                grain_direction=p.grain_direction,
                edge_banding=eb,
            ))

    if not all_pieces:
        raise HTTPException(status_code=400, detail="No hay piezas para optimizar.")

    time_limit = max(10.0, min(req.time_limit, 180.0))

    try:
        boards, metrics = _engine.optimize(
            pieces=all_pieces,
            board_w=req.board_w,
            board_h=req.board_h,
            kerf=req.kerf,
            time_limit=time_limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    boards_out = []
    for b in boards:
        pieces_out = [
            AdvPlacedPieceOut(
                piece_id=pp.piece_id, name=pp.name,
                x=round(pp.x, 2), y=round(pp.y, 2),
                width=round(pp.width, 2), height=round(pp.height, 2),
                rotated=pp.rotated,
                original_width=round(pp.original_width, 2),
                original_height=round(pp.original_height, 2),
                edge_top=pp.edge_banding.top,
                edge_bottom=pp.edge_banding.bottom,
                edge_left=pp.edge_banding.left,
                edge_right=pp.edge_banding.right,
            ) for pp in b.pieces
        ]
        fs_out = [
            AdvFreeSpaceOut(x=round(fs.x, 2), y=round(fs.y, 2),
                            width=round(fs.width, 2), height=round(fs.height, 2),
                            area=round(fs.area, 2))
            for fs in b.free_spaces
        ]
        cl_out = [
            AdvCutLineOut(x1=round(cl.x1, 2), y1=round(cl.y1, 2),
                          x2=round(cl.x2, 2), y2=round(cl.y2, 2),
                          direction=cl.direction, sequence=cl.sequence,
                          length=round(cl.length, 2))
            for cl in b.cut_lines
        ]
        boards_out.append(AdvBoardOut(
            number=b.number,
            efficiency=round(b.efficiency * 100, 2),
            area_used=round(b.area_used, 2),
            pieces=pieces_out,
            free_spaces=fs_out,
            cut_lines=cl_out,
        ))

    elapsed_ms = int((time.time() - t0) * 1000)

    return AdvResponse(
        boards_used=metrics.boards_used,
        efficiency_percent=metrics.efficiency_percent,
        waste_percent=metrics.waste_percent,
        area_used=metrics.area_used,
        area_total=metrics.area_total,
        area_wasted=metrics.area_wasted,
        total_cuts=metrics.total_cuts,
        cut_meters=metrics.cut_meters,
        reusable_offcuts=metrics.reusable_offcuts,
        fragmentation_index=metrics.fragmentation_index,
        score=metrics.score,
        algorithm=metrics.algorithm,
        passes_run=metrics.passes_run,
        time_ms=elapsed_ms,
        boards=boards_out,
    )


@app.post("/optimize", response_model=OptimizeResponse)
def optimize_endpoint(req: OptimizeRequest):
    t0 = time.time()

    # Expand pieces by quantity
    expanded: List[PieceInput] = []
    for p in req.pieces:
        for _ in range(p.quantity):
            expanded.append(PieceInput(
                id=p.id,
                name=p.name,
                w=p.w,
                h=p.h,
                can_rotate=p.can_rotate,
            ))

    if not expanded:
        raise HTTPException(status_code=400, detail="No hay piezas para optimizar.")

    # Validate: every piece must fit in the board (at least one orientation)
    for p in expanded:
        fits = (p.w <= req.board_w and p.h <= req.board_h)
        fits_rot = p.can_rotate and (p.h <= req.board_w and p.w <= req.board_h)
        if not fits and not fits_rot:
            raise HTTPException(
                status_code=400,
                detail=f"La pieza '{p.name}' ({p.w}×{p.h}mm) no entra en la plancha ({req.board_w}×{req.board_h}mm)."
            )

    try:
        result: OptimizationResult = optimize(
            pieces=expanded,
            board_w=req.board_w,
            board_h=req.board_h,
            kerf=req.kerf,
            time_limit=max(5.0, min(req.time_limit, 120.0)),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    elapsed_ms = int((time.time() - t0) * 1000)

    return OptimizeResponse(
        boards_used=result.boards_used,
        efficiency_percent=round(result.efficiency, 2),
        area_used=round(result.area_used, 2),
        area_total=round(result.total_area, 2),
        area_wasted=round(result.total_area - result.area_used, 2),
        algorithm=result.algorithm,
        time_ms=elapsed_ms,
        boards=[
            BoardOut(
                number=b.number,
                pieces=[
                    PlacedPieceOut(
                        piece_id=p.piece_id,
                        name=p.name,
                        x=round(p.x, 1),
                        y=round(p.y, 1),
                        w=round(p.w, 1),
                        h=round(p.h, 1),
                        rotated=p.rotated,
                    )
                    for p in b.pieces
                ],
            )
            for b in result.boards
        ],
    )
