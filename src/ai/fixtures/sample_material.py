"""
fixtures/sample_material.py — Synthetic content thay cho file PDF thật

⚠️  MOCKED_FILE_PARSING = True
    Tuần 2: thay bằng PyMuPDF parser đọc file_path từ DB materials table.
    Cách swap: hàm load_material_chunks(material_id, file_path) → gọi fitz.open(file_path).
"""
from __future__ import annotations
from typing import TypedDict

MOCKED_FILE_PARSING = True  # ← Flag rõ ràng

class Chunk(TypedDict):
    page: int
    text: str


class MaterialFixture(TypedDict):
    course_id: str
    title: str
    approved_for_ai: bool
    chunks: list[Chunk]


# ── Synthetic materials — khớp với seed data của platform pair ──────────────
SAMPLE_MATERIALS: dict[str, MaterialFixture] = {

    # ── Course A — material được duyệt ──────────────────────────────────────
    "mat-intro-001": {
        "course_id": "course-a",
        "title": "Introduction to Programming — Week 1",
        "approved_for_ai": True,
        "chunks": [
            {
                "page": 1,
                "text": (
                    "A variable is a named storage location in memory that holds a value. "
                    "Variables must be declared before use. In Python, you do not need to "
                    "specify the type explicitly; the interpreter infers it at runtime. "
                    "Example: x = 10 creates an integer variable named x with value 10."
                ),
            },
            {
                "page": 2,
                "text": (
                    "Control flow structures determine the order of execution. "
                    "The if-else statement evaluates a boolean condition and branches accordingly. "
                    "Loops (for, while) repeat a block of code. "
                    "A for loop iterates over a sequence such as a list or range. "
                    "Example: for i in range(5): print(i) prints 0 through 4."
                ),
            },
            {
                "page": 3,
                "text": (
                    "A function is a reusable block of code defined with the def keyword. "
                    "Functions can accept parameters and return values. "
                    "Example: def add(a, b): return a + b. "
                    "Calling add(2, 3) returns 5. Functions improve code organization and reuse."
                ),
            },
            {
                "page": 4,
                "text": (
                    "Data types in Python include int, float, str, bool, list, tuple, dict, and set. "
                    "Lists are mutable ordered sequences. Tuples are immutable. "
                    "Dictionaries store key-value pairs. Sets store unique unordered elements. "
                    "Type conversion: int('42') converts string '42' to integer 42."
                ),
            },
        ],
    },

    "mat-control-002": {
        "course_id": "course-a",
        "title": "Control Flow and Loops — Week 2",
        "approved_for_ai": True,
        "chunks": [
            {
                "page": 1,
                "text": (
                    "The while loop executes as long as its condition is True. "
                    "It is used when the number of iterations is unknown beforehand. "
                    "Example: while x > 0: x -= 1. Always ensure the loop has a termination condition "
                    "to avoid infinite loops."
                ),
            },
            {
                "page": 2,
                "text": (
                    "Nested loops place one loop inside another. "
                    "The inner loop runs completely for each iteration of the outer loop. "
                    "Common use case: iterating over a 2D matrix. "
                    "Time complexity of nested loops is often O(n²)."
                ),
            },
            {
                "page": 3,
                "text": (
                    "Break and continue statements modify loop execution. "
                    "break exits the loop immediately. continue skips the rest of the current iteration. "
                    "Example: for i in range(10): if i == 5: break — stops at 5. "
                    "Use these carefully to avoid confusing logic."
                ),
            },
        ],
    },

    # ── Course A — material CHƯA được duyệt (draft) ─────────────────────────
    "mat-draft-003": {
        "course_id": "course-a",
        "title": "Advanced Topics — DRAFT (Not Approved)",
        "approved_for_ai": False,   # ← phải bị loại hoàn toàn khỏi retrieval
        "chunks": [
            {
                "page": 1,
                "text": (
                    "This is draft content that has NOT been approved by the instructor. "
                    "It must never appear in student answers or citations. "
                    "If this text appears in a response, it is a retrieval security failure."
                ),
            },
        ],
    },

    # ── Course B — material riêng ────────────────────────────────────────────
    "mat-course-b-001": {
        "course_id": "course-b",
        "title": "Data Structures — Week 1",
        "approved_for_ai": True,
        "chunks": [
            {
                "page": 1,
                "text": (
                    "A stack is a last-in, first-out (LIFO) data structure. "
                    "Operations: push (add to top), pop (remove from top), peek (view top). "
                    "Use cases: undo functionality, call stack in recursion, expression evaluation."
                ),
            },
            {
                "page": 2,
                "text": (
                    "A queue is a first-in, first-out (FIFO) data structure. "
                    "Operations: enqueue (add to rear), dequeue (remove from front). "
                    "Use cases: task scheduling, print queues, breadth-first search."
                ),
            },
        ],
    },
}


def get_material(material_id: str) -> MaterialFixture | None:
    return SAMPLE_MATERIALS.get(material_id)


def get_approved_materials_for_course(course_id: str) -> dict[str, MaterialFixture]:
    """Trả về các material được duyệt (approved_for_ai=True) của course."""
    return {
        mid: mat
        for mid, mat in SAMPLE_MATERIALS.items()
        if mat["course_id"] == course_id and mat["approved_for_ai"]
    }
