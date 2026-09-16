"""
retriever.py — In-memory TF-IDF retrieval trên approved materials

Chỉ trả về chunks từ materials có approved_for_ai = True.
Draft / unapproved materials bị loại hoàn toàn.

Tuần 2: thay _load_chunks() bằng query DB + PyMuPDF.
"""
from __future__ import annotations
import math
import re
from typing import TypedDict

from fixtures.sample_material import get_approved_materials_for_course


class RetrievedChunk(TypedDict):
    material_id: str
    title: str
    page: int
    snippet: str        # ~120 ký tự đầu cho hiển thị UI
    text: str           # Toàn văn nội dung chunk để LLM đọc và tổng hợp
    score: float


def _tokenize(text: str) -> list[str]:
    # Handle both ASCII and unicode (Vietnamese, etc.)
    return re.findall(r"[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+", text.lower())



def _tf(tokens: list[str]) -> dict[str, float]:
    freq: dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1
    n = max(len(tokens), 1)
    return {w: c / n for w, c in freq.items()}


# ── Từ điển mở rộng thuật ngữ CNTT Tiếng Việt <-> Tiếng Anh ──────────────
VIETNAMESE_CS_MAPPINGS: dict[str, list[str]] = {
    "biến": ["variable", "variables"],
    "hàm": ["function", "functions", "def"],
    "vòng lặp": ["loop", "loops", "while", "for"],
    "lặp": ["loop", "loops", "iteration", "iterates"],
    "con trỏ": ["pointer", "pointers"],
    "mảng": ["array", "arrays", "list", "lists"],
    "danh sách": ["list", "lists"],
    "từ điển": ["dict", "dictionary", "dictionaries"],
    "bộ": ["tuple", "tuples", "set", "sets"],
    "tập hợp": ["set", "sets"],
    "bộ nhớ": ["memory", "storage", "allocation"],
    "kiểu dữ liệu": ["data", "type", "types"],
    "kiểu": ["type", "types"],
    "số nguyên": ["integer", "int"],
    "số thực": ["float", "double"],
    "chuỗi": ["string", "str"],
    "ký tự": ["char", "character"],
    "điều kiện": ["condition", "if", "else", "branch"],
    "rẽ nhánh": ["branch", "if", "else"],
    "cú pháp": ["syntax"],
    "lớp": ["class", "classes"],
    "đối tượng": ["object", "objects"],
    "cấp phát": ["allocate", "allocation", "malloc"],
    "giải phóng": ["free", "deallocate"],
    "thu hồi": ["free", "garbage"],
    "ngăn xếp": ["stack"],
    "hàng đợi": ["queue"],
    "đệ quy": ["recursion", "recursive"],
    "tham số": ["parameter", "parameters", "argument", "arguments"],
    "trả về": ["return", "returns"],
    "ví dụ": ["example", "examples"],
    "toán tử": ["operator", "operators"],
}


def _expand_query_tokens(query: str, query_tokens: list[str]) -> list[str]:
    """Mở rộng câu hỏi tiếng Việt sang các thuật ngữ kỹ thuật tiếng Anh để đối khớp với slide."""
    expanded = list(query_tokens)
    q_lower = query.lower()
    for vn_term, en_synonyms in VIETNAMESE_CS_MAPPINGS.items():
        if vn_term in q_lower:
            for syn in en_synonyms:
                if syn not in expanded:
                    expanded.append(syn)
    return expanded


def _idf(word: str, docs: list[list[str]]) -> float:
    df = sum(1 for d in docs if word in d)
    return math.log((len(docs) + 1) / (df + 1)) + 1.0


def retrieve(query: str, course_id: str, top_k: int = 5) -> list[RetrievedChunk]:
    """
    Trả về top_k chunks liên quan nhất từ approved materials của course_id.
    Chunks từ draft / unapproved materials KHÔNG bao giờ xuất hiện ở đây.
    """
    approved = get_approved_materials_for_course(course_id)
    if not approved:
        return []

    # Thu thập tất cả (doc, metadata)
    all_docs: list[tuple[str, str, int, str]] = []  # (material_id, title, page, text)
    for mid, mat in approved.items():
        for chunk in mat["chunks"]:
            all_docs.append((mid, mat["title"], chunk["page"], chunk["text"]))

    if not all_docs:
        return []

    # Tokenize và mở rộng từ khóa song ngữ
    tokenized_docs = [_tokenize(text) for _, _, _, text in all_docs]
    base_tokens = _tokenize(query)
    query_tokens = _expand_query_tokens(query, base_tokens)

    # TF-IDF cosine similarity
    vocab = set(query_tokens)
    for td in tokenized_docs:
        vocab.update(td)
    vocab_list = list(vocab)

    def tfidf_vec(tokens: list[str]) -> dict[str, float]:
        tf = _tf(tokens)
        return {w: tf.get(w, 0.0) * _idf(w, tokenized_docs) for w in vocab_list}

    q_vec = tfidf_vec(query_tokens)

    results: list[RetrievedChunk] = []
    for i, (mid, title, page, text) in enumerate(all_docs):
        d_vec = tfidf_vec(tokenized_docs[i])
        dot = sum(q_vec.get(w, 0) * d_vec.get(w, 0) for w in vocab_list)
        q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1e-9
        d_norm = math.sqrt(sum(v ** 2 for v in d_vec.values())) or 1e-9
        score = dot / (q_norm * d_norm)

        if score > 0:
            results.append(RetrievedChunk(
                material_id=mid,
                title=title,
                page=page,
                snippet=text[:120].rstrip() + "…",
                text=text,
                score=round(score, 4),
            ))

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
