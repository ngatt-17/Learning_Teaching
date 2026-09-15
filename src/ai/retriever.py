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
    snippet: str        # ~100 ký tự đầu
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

    # Tokenize
    tokenized_docs = [_tokenize(text) for _, _, _, text in all_docs]
    query_tokens = _tokenize(query)

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
                score=round(score, 4),
            ))

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
