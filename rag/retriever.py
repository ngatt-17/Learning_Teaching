"""
retriever.py — Hybrid Search (BM25 + Semantic + RRF) trên approved materials

Theo chuẩn thiết kế Day 18 (Production RAG):
- Kết hợp 2 trục tìm kiếm:
  1. BM25 Search (Lexical): Bắt chính xác từ khóa kỹ thuật (exact tokens, code terms, syntax).
  2. Semantic / Bilingual Search: TF-IDF mở rộng từ điển song ngữ Anh-Việt bắt ngữ nghĩa.
  3. RRF (Reciprocal Rank Fusion): Gộp thứ hạng 2 nguồn với hằng số k=60.
- Chỉ trả về chunks từ materials có approved_for_ai = True.
- Draft / unapproved materials bị loại hoàn toàn.
"""
from __future__ import annotations
import math
import re
import unicodedata
from typing import TypedDict

from config import CHUNK_SIZE_WORDS, CHUNK_OVERLAP_WORDS
from fixtures.sample_material import get_approved_materials_for_course


class RetrievedChunk(TypedDict):
    material_id: str
    title: str
    page: int
    snippet: str        # ~120 ký tự đầu cho hiển thị UI
    text: str           # Toàn văn nội dung chunk để LLM đọc và tổng hợp
    score: float
    matched_terms: int  # Số từ khóa nội dung (không tính stopword) của câu hỏi có trong chunk
    phrase_hits: int    # Số cụm 2 âm tiết liền nhau của câu hỏi ("tác tử", "time quantum") có trong chunk


# Từ chức năng không mang nội dung — bỏ qua khi đo mức độ khớp bằng chứng, để câu hỏi
# ngoài phạm vi ("thời tiết hôm nay thế nào?") không "khớp" tài liệu chỉ nhờ "là", "gì", "the".
STOPWORDS: frozenset[str] = frozenset("""
là gì của và có các những được cho trong một này nào không thế hãy em bạn mình tôi giúp ạ với về khi thì
như hỏi sao vì tại nên đã đang sẽ rồi nhé nhỉ vậy ra vào lên đó đây kia ở từ theo bằng hay hoặc mà nếu
thể cần phải muốn biết giải thích khái niệm nêu cách xin chào ơi ai khác nhau giống giữa gồm loại dùng để làm
bao nhiêu thường
the a an is are was were be been what which who whom how why when where of in on at to for from by with
and or not no do does did can could should would will this that these those it its as into about please
explain tell me my i you your we our there their than then so if used use difference between different mean
means define definition
""".split())


def _tokenize(text: str) -> list[str]:
    # Handle both ASCII and unicode (Vietnamese, etc.); NFC keeps precomposed diacritics in one token.
    return re.findall(r"[0-9a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+", unicodedata.normalize("NFC", text).lower())


def content_tokens(text: str) -> list[str]:
    """Tokens that carry meaning: stopwords removed."""
    return [t for t in _tokenize(text) if t not in STOPWORDS]


def content_bigrams(tokens: list[str]) -> set[tuple[str, str]]:
    """
    Adjacent pairs of meaningful tokens. Vietnamese words are usually two syllables, so a
    pair ("tác", "tử") identifies the word where a single syllable ("tử" in "điện tử") cannot.
    """
    return {(a, b) for a, b in zip(tokens, tokens[1:]) if a not in STOPWORDS and b not in STOPWORDS}


def _split_words(text: str, size: int, overlap: int) -> list[str]:
    words = text.split()
    if len(words) <= size:
        return [text.strip()] if text.strip() else []
    step = max(size - overlap, 1)
    return [" ".join(words[i:i + size]) for i in range(0, len(words), step)]


def materials_from_platform(content: dict) -> dict[str, dict]:
    """
    Convert the Platform API payload (GET /courses/{id}/materials/content) into the
    fixture shape used by retrieve(). Pages longer than CHUNK_SIZE_WORDS are split into
    overlapping chunks that keep their page number, so every citation stays exact.
    Materials not marked approved are dropped again here (defence in depth).
    """
    materials: dict[str, dict] = {}
    for m in content.get("materials", []):
        if m.get("status", "approved") != "approved" or m.get("approved_for_ai") is False:
            continue
        chunks = []
        for page in m.get("pages", []):
            for piece in _split_words(page.get("content", ""), CHUNK_SIZE_WORDS, CHUNK_OVERLAP_WORDS):
                chunks.append({"page": page["page_number"], "text": piece})
        materials[m["id"]] = {
            "course_id": content.get("course_id"),
            "title": m["title"],
            "approved_for_ai": True,
            "chunks": chunks,
        }
    return materials


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


def _bm25_scores(query_tokens: list[str], docs: list[list[str]], k1: float = 1.5, b: float = 0.75) -> list[float]:
    """Thuật toán BM25Okapi bắt chính xác từ khóa kỹ thuật (exact tokens)."""
    n_docs = len(docs)
    if n_docs == 0:
        return []
    doc_lens = [len(d) for d in docs]
    avgdl = sum(doc_lens) / max(n_docs, 1)

    scores = [0.0] * n_docs
    unique_q = set(query_tokens)

    for q in unique_q:
        df = sum(1 for d in docs if q in d)
        if df == 0:
            continue
        idf = math.log((n_docs - df + 0.5) / (df + 0.5) + 1.0)
        for i, doc in enumerate(docs):
            freq = doc.count(q)
            if freq > 0:
                num = freq * (k1 + 1.0)
                den = freq + k1 * (1.0 - b + b * (doc_lens[i] / avgdl))
                scores[i] += idf * (num / den)

    return scores


def _semantic_cosine_scores(query_tokens: list[str], docs: list[list[str]]) -> list[float]:
    """Tính Cosine Similarity với từ điển mở rộng song ngữ (Semantic/Lexical hybrid)."""
    n_docs = len(docs)
    if n_docs == 0:
        return []

    vocab = set(query_tokens)
    for td in docs:
        vocab.update(td)
    vocab_list = list(vocab)

    def tfidf_vec(tokens: list[str]) -> dict[str, float]:
        tf = _tf(tokens)
        return {w: tf.get(w, 0.0) * _idf(w, docs) for w in vocab_list}

    q_vec = tfidf_vec(query_tokens)
    q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1e-9

    scores = [0.0] * n_docs
    for i, doc in enumerate(docs):
        d_vec = tfidf_vec(doc)
        dot = sum(q_vec.get(w, 0) * d_vec.get(w, 0) for w in vocab_list)
        d_norm = math.sqrt(sum(v ** 2 for v in d_vec.values())) or 1e-9
        scores[i] = dot / (q_norm * d_norm)

    return scores


def retrieve(
    query: str,
    course_id: str,
    top_k: int = 5,
    materials: dict[str, dict] | None = None,
    prefer_material_id: str | None = None,
) -> list[RetrievedChunk]:
    """
    Hybrid Search (BM25 + Semantic + RRF) trên approved materials của course_id.
    - BM25: Bắt chính xác từ khóa kỹ thuật.
    - Semantic: TF-IDF với từ điển mở rộng Anh-Việt.
    - RRF (Reciprocal Rank Fusion): Gộp 2 bảng xếp hạng với k=60.

    `materials`: nội dung đã duyệt lấy từ Platform API (materials_from_platform). Khi
    None, dùng fixtures offline (CLI demo, eval_benchmark).
    `prefer_material_id`: tài liệu sinh viên đang mở — được cộng điểm nhẹ khi xếp hạng.
    """
    source = materials if materials is not None else get_approved_materials_for_course(course_id)
    approved = {mid: mat for mid, mat in source.items() if mat.get("approved_for_ai")}
    if not approved:
        return []

    # Thu thập tất cả (doc, metadata)
    all_docs: list[tuple[str, str, int, str]] = []  # (material_id, title, page, text)
    for mid, mat in approved.items():
        for chunk in mat["chunks"]:
            all_docs.append((mid, mat["title"], chunk["page"], chunk["text"]))

    if not all_docs:
        return []

    tokenized_docs = [_tokenize(text) for _, _, _, text in all_docs]
    base_query_tokens = content_tokens(query)
    expanded_query_tokens = _expand_query_tokens(query, base_query_tokens)
    if not expanded_query_tokens:
        return []
    query_terms = set(expanded_query_tokens)
    query_phrases = content_bigrams(_tokenize(query))

    # 1. Điểm BM25 (dùng cả base tokens và expanded tokens)
    bm25_scores = _bm25_scores(expanded_query_tokens, tokenized_docs)

    # 2. Điểm Semantic Cosine
    semantic_scores = _semantic_cosine_scores(expanded_query_tokens, tokenized_docs)

    # 3. Tạo 2 bảng xếp hạng (Rank lists)
    bm25_ranked = sorted(
        [i for i in range(len(all_docs)) if bm25_scores[i] > 0],
        key=lambda i: bm25_scores[i],
        reverse=True
    )
    semantic_ranked = sorted(
        [i for i in range(len(all_docs)) if semantic_scores[i] > 0],
        key=lambda i: semantic_scores[i],
        reverse=True
    )

    # 4. RRF Fusion (k=60 theo Slide 24)
    RRF_K = 60
    rrf_scores: dict[int, float] = {}

    for rank_idx, doc_i in enumerate(bm25_ranked, start=1):
        rrf_scores[doc_i] = rrf_scores.get(doc_i, 0.0) + (1.0 / (RRF_K + rank_idx))

    for rank_idx, doc_i in enumerate(semantic_ranked, start=1):
        rrf_scores[doc_i] = rrf_scores.get(doc_i, 0.0) + (1.0 / (RRF_K + rank_idx))

    if not rrf_scores:
        return []

    # Sắp xếp theo điểm RRF giảm dần
    sorted_doc_indices = sorted(rrf_scores.keys(), key=lambda i: rrf_scores[i], reverse=True)

    results: list[RetrievedChunk] = []
    for doc_i in sorted_doc_indices:
        mid, title, page, text = all_docs[doc_i]
        # Chuẩn hóa score để tương thích ngược với MIN_RELEVANCE_SCORE (score > 0.05)
        # Điểm RRF tối đa ~ 1/61 + 1/61 = 0.0328 -> nhân tỉ lệ ~10.0 để điểm rõ ràng
        norm_score = rrf_scores[doc_i] * 10.0
        if prefer_material_id and mid == prefer_material_id:
            norm_score *= 1.15
        results.append(RetrievedChunk(
            material_id=mid,
            title=title,
            page=page,
            snippet=text[:120].rstrip() + ("…" if len(text) > 120 else ""),
            text=text,
            score=round(norm_score, 4),
            matched_terms=len(query_terms.intersection(tokenized_docs[doc_i])),
            phrase_hits=len(query_phrases.intersection(content_bigrams(tokenized_docs[doc_i]))),
        ))

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]
