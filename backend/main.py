import os
import sqlite3
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = os.environ.get("DB_PATH", str(ROOT / "data" / "app.db"))
STAGE_COUNT = 15
THEMES = ["rainbow", "forest", "moon", "dash"]


def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            theme TEXT NOT NULL DEFAULT 'rainbow',
            total_coins INTEGER NOT NULL DEFAULT 0,
            high_score INTEGER NOT NULL DEFAULT 0,
            current_stage INTEGER NOT NULL DEFAULT 1
        )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS stages (
            stage_number INTEGER PRIMARY KEY,
            completed INTEGER NOT NULL DEFAULT 0,
            best_score INTEGER NOT NULL DEFAULT 0
        )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS theme_scores (
            theme TEXT PRIMARY KEY,
            high_score INTEGER NOT NULL DEFAULT 0
        )"""
        )
        conn.execute("INSERT OR IGNORE INTO profile (id) VALUES (1)")
        for stage in range(1, STAGE_COUNT + 1):
            conn.execute("INSERT OR IGNORE INTO stages (stage_number) VALUES (?)", (stage,))
        for theme in THEMES:
            conn.execute("INSERT OR IGNORE INTO theme_scores (theme) VALUES (?)", (theme,))


app = FastAPI(title="무지개 점프 대모험")
init_db()


class Settings(BaseModel):
    theme: str


class CompleteStage(BaseModel):
    stage: int
    score: int
    coins: int
    lives: int = 3
    theme: str


class GameState(BaseModel):
    current_stage: int


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/progress")
def progress():
    with get_db() as conn:
        profile = dict(
            conn.execute(
                "SELECT theme, total_coins, high_score, current_stage FROM profile WHERE id = 1"
            ).fetchone()
        )
        stages = [
            dict(row)
            for row in conn.execute(
                "SELECT stage_number, completed, best_score FROM stages ORDER BY stage_number"
            )
        ]
        theme_scores = {
            row["theme"]: row["high_score"]
            for row in conn.execute("SELECT theme, high_score FROM theme_scores")
        }
    return {
        **profile,
        "stages": stages,
        "theme_scores": theme_scores,
        "completed_count": sum(s["completed"] for s in stages),
    }


@app.put("/api/settings")
def settings(payload: Settings):
    theme = payload.theme if payload.theme in THEMES else "rainbow"
    with get_db() as conn:
        conn.execute("UPDATE profile SET theme = ? WHERE id = 1", (theme,))
    return {"theme": theme}


@app.put("/api/game-state")
def game_state(payload: GameState):
    stage = max(1, min(STAGE_COUNT, payload.current_stage))
    with get_db() as conn:
        conn.execute("UPDATE profile SET current_stage = ? WHERE id = 1", (stage,))
    return {"current_stage": stage}


@app.post("/api/complete-stage")
def complete_stage(payload: CompleteStage):
    stage = max(1, min(STAGE_COUNT, payload.stage))
    theme = payload.theme if payload.theme in THEMES else "rainbow"
    score = max(0, payload.score)
    coins = max(0, payload.coins)
    with get_db() as conn:
        old = conn.execute(
            "SELECT best_score FROM stages WHERE stage_number = ?", (stage,)
        ).fetchone()["best_score"]
        conn.execute(
            "UPDATE stages SET completed = 1, best_score = ? WHERE stage_number = ?",
            (max(old, score), stage),
        )
        profile = conn.execute(
            "SELECT total_coins, high_score FROM profile WHERE id = 1"
        ).fetchone()
        conn.execute(
            "UPDATE profile SET total_coins = ?, high_score = ?, current_stage = ? WHERE id = 1",
            (
                profile["total_coins"] + coins,
                max(profile["high_score"], score),
                min(STAGE_COUNT, stage + 1),
            ),
        )
        old_theme = conn.execute(
            "SELECT high_score FROM theme_scores WHERE theme = ?", (theme,)
        ).fetchone()["high_score"]
        conn.execute(
            "UPDATE theme_scores SET high_score = ? WHERE theme = ?",
            (max(old_theme, score), theme),
        )
    return progress()
