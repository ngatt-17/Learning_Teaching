"""
reranker.py — Two-Stage Reranking Engine (m3_rerank)

Theo chuẩn thiết kế Day 18 (Slide 32–34: Two-Stage Retrieval):
  Stage 1 (Broad Recall): Lấy Top-10 ứng viên từ Hybrid Search (retriever.py).
  Stage 2 (High Precision): Chấm điểm chéo cặp (query, chunk) để chọn Top-3 chính xác nhất nạp vào LLM.

Lợi ích (Slide 33):
  Tăng 15–25% Precision, loại bỏ hiện tượng "Lost in the Middle".

Cơ chế thực thi:
  1. Nếu có thư viện `flashrank` -> Sử dụng mô hình Flashrank (siêu nhẹ, <5ms).
  2. Fallback: Thuật toán Cross-Alignment Scorer (so khớp cụm từ, độ dày đặc từ khóa, ngữ cảnh câu).
"""
from __future__ import annotations
import logging
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from retriever import RetrievedChunk

logger = logging.getLogger(__name__)

# Thử import flashrank nếu đã cài
_HAS_FLASHRANK = False
_ranker = None
try:
    from flashrank import Ranker, RerankRequest
    _ranker = Ranker()
    _HAS_FLASHRANK = True
    logger.info("Reranker: Flashrank cross-encoder loaded successfully.")
except Exception:
    logger.info("Reranker: Flashrank not installed. Using native Cross-Alignment Scorer.")


def _clean_tokens(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF0-9_]+", text.lower())


def _cross_alignment_score(query: str, chunk_text: str) -> float:
    """
    Thuật toán Cross-Scoring đối khớp câu hỏi và đoạn văn:
    - So khớp từ khóa độc nhất (Unigrams)
    - So khớp cụm từ liền kề (Bigrams / Phrase match)
    - Mức độ tập trung của từ khóa (Density penalty)
    """
    q_tokens = _clean_tokens(query)
    c_tokens = _clean_tokens(chunk_text)
    if not q_tokens or not c_tokens:
        return 0.0

    q_set = set(q_tokens)
    c_set = set(c_tokens)

    # 1. Tỷ lệ bao phủ từ khóa câu hỏi (Coverage)
    overlap = q_set.intersection(c_set)
    coverage = len(overlap) / len(q_set)

    # 2. So khớp cụm 2 từ liền nhau (Bigram matching)
    q_bigrams = set(zip(q_tokens[:-1], q_tokens[1:]))
    c_bigrams = set(zip(c_tokens[:-1], c_tokens[1:]))
    bigram_score = 0.0
    if q_bigrams:
        bi_overlap = q_bigrams.intersection(c_bigrams)
        bigram_score = len(bi_overlap) / len(q_bigrams)

    # 3. Tần suất xuất hiện lặp lại của từ khóa trong chunk
    term_freq = sum(c_tokens.count(w) for w in overlap) / max(len(c_tokens), 1)

    final_score = (coverage * 0.5) + (bigram_score * 0.35) + (term_freq * 0.15)
    return round(final_score, 4)


def rerank(
    query: str,
    chunks: list["RetrievedChunk"],
    top_k: int = 3,
) -> list["RetrievedChunk"]:
    """
    Chấm điểm lại danh sách chunks ứng viên và trả về top_k chunks tinh túy nhất.
    """
    if not chunks:
        return []
    if len(chunks) <= top_k:
        return chunks

    # 1. Chạy Flashrank nếu khả dụng
    if _HAS_FLASHRANK and _ranker is not None:
        try:
            passages = [
                {"id": idx, "text": c.get("text", c["snippet"])}
                for idx, c in enumerate(chunks)
            ]
            rerank_req = RerankRequest(query=query, passages=passages)
            ranked_results = _ranker.rerank(rerank_req)

            sorted_chunks: list["RetrievedChunk"] = []
            for item in ranked_results[:top_k]:
                orig_idx = item["id"]
                orig_chunk = chunks[orig_idx].copy()
                orig_chunk["score"] = round(float(item["score"]), 4)
                sorted_chunks.append(orig_chunk)
            return sorted_chunks
        except Exception as e:
            logger.warning("Flashrank error (%s). Falling back to Cross-Alignment.", e)

    # 2. Chạy native Cross-Alignment Scorer
    scored_candidates = []
    for c in chunks:
        content = c.get("text", c["snippet"])
        cross_score = _cross_alignment_score(query, content)
        combined_score = round(c["score"] * 0.4 + cross_score * 0.6, 4)
        c_copy = c.copy()
        c_copy["score"] = combined_score
        scored_candidates.append(c_copy)

    scored_candidates.sort(key=lambda x: x["score"], reverse=True)
    return scored_candidates[:top_k]
