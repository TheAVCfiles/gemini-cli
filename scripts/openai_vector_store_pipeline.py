"""Utility helpers for building and evaluating OpenAI vector stores.

This script mirrors the playground recipes for uploading a directory of PDFs
into a vector store and running a lightweight retrieval evaluation loop. By
default it looks for ``openai_blog_pdfs`` in the current working directory and
creates a store named ``openai_blog_store``.

Example usage::

    python scripts/openai_vector_store_pipeline.py \
        --pdf-dir /path/to/pdfs \
        --store-name my_vector_store \
        --top-k 5 \
        --max-workers 6 \
        --build-store \
        --generate-eval \
        --run-eval

The script expects ``OPENAI_API_KEY`` to be present in your environment.
"""

from __future__ import annotations

import argparse
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from openai import OpenAI
from pypdf import PdfReader
from tenacity import retry, stop_after_attempt, wait_exponential_jitter
from tqdm import tqdm

DEFAULT_MODEL_QA = "gpt-4o-mini"
DEFAULT_MODEL_Q_GEN = "gpt-4o"
DEFAULT_TOP_K = 5
DEFAULT_MAX_WORKERS = 6


@dataclass
class VectorStoreStats:
    """Simple status tracker for vector store uploads."""

    total: int
    ok: int = 0
    fail: int = 0
    errors: List[Dict[str, str]] | None = None

    def __post_init__(self) -> None:
        if self.errors is None:
            self.errors = []


class VectorStorePipeline:
    """Build and evaluate a vector store from a local directory of PDFs."""

    def __init__(
        self,
        pdf_dir: str,
        store_name: str,
        model_qa: str = DEFAULT_MODEL_QA,
        model_q_gen: str = DEFAULT_MODEL_Q_GEN,
        top_k: int = DEFAULT_TOP_K,
        max_workers: int = DEFAULT_MAX_WORKERS,
        api_key: Optional[str] = None,
    ) -> None:
        self.pdf_dir = pdf_dir
        self.store_name = store_name
        self.model_qa = model_qa
        self.model_q_gen = model_q_gen
        self.top_k = top_k
        self.max_workers = max_workers
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

    def list_pdfs(self) -> List[str]:
        if not os.path.isdir(self.pdf_dir):
            raise FileNotFoundError(f"Directory not found: {self.pdf_dir}")
        return [
            os.path.join(self.pdf_dir, f)
            for f in os.listdir(self.pdf_dir)
            if f.lower().endswith(".pdf")
        ]

    @retry(wait=wait_exponential_jitter(1, 5), stop=stop_after_attempt(5))
    def create_vector_store(self) -> Dict[str, Any]:
        store = self.client.vector_stores.create(name=self.store_name)
        return {
            "id": store.id,
            "name": store.name,
            "created_at": store.created_at,
            "file_count": store.file_counts.completed,
        }

    @retry(wait=wait_exponential_jitter(1, 5), stop=stop_after_attempt(5))
    def upload_pdf(
        self, file_path: str, vector_store_id: str, metadata: Optional[Dict[str, str]] = None
    ) -> Tuple[str, bool, str]:
        filename = os.path.basename(file_path)
        try:
            uploaded = self.client.files.create(
                file=open(file_path, "rb"), purpose="assistants", metadata=metadata or {}
            )
            self.client.vector_stores.files.create(vector_store_id=vector_store_id, file_id=uploaded.id)
            return filename, True, ""
        except Exception as exc:  # noqa: BLE001
            return filename, False, str(exc)

    def extract_text(self, pdf_path: str) -> str:
        try:
            reader = PdfReader(pdf_path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] Could not read {pdf_path}: {exc}")
            return ""

    def file_metadata(self, path: str) -> Dict[str, str]:
        base = os.path.basename(path).lower()
        metadata: Dict[str, str] = {}
        if "cipher" in base:
            metadata["mode"] = "CIPHER"
        elif "echo" in base:
            metadata["mode"] = "ECHO"
        elif "surface" in base:
            metadata["mode"] = "SURFACE"
        return metadata

    def build_store_and_upload(self) -> Dict[str, Any]:
        files = self.list_pdfs()
        if not files:
            raise RuntimeError(f"No PDFs found in {self.pdf_dir}")

        vector_store = self.create_vector_store()
        stats = VectorStoreStats(total=len(files))

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self.upload_pdf, path, vector_store["id"], self.file_metadata(path)): path
                for path in files
            }
            for future in tqdm(as_completed(futures), total=len(files), desc="Uploading PDFs"):
                filename, ok, error = future.result()
                if ok:
                    stats.ok += 1
                else:
                    stats.fail += 1
                    stats.errors.append({"file": filename, "error": error})

        print(
            f"[VectorStore] id={vector_store['id']} | uploaded={stats.ok}/{stats.total} | failures={stats.fail}"
        )
        for error in stats.errors:
            print(f"  - {error['file']}: {error['error']}")

        return {"vector_store": vector_store, "stats": stats.__dict__}

    def vector_search(self, vector_store_id: str, query: str, k: Optional[int] = None) -> List[Dict[str, Any]]:
        max_results = k or self.top_k
        result = self.client.vector_stores.search(
            vector_store_id=vector_store_id, query=query, max_results=max_results
        )
        return [
            {
                "filename": res.filename,
                "score": res.score,
                "chars": len(res.content[0].text) if res.content else 0,
            }
            for res in result.data
        ]

    def generate_question_from_text(self, text: str) -> str:
        prompt = (
            "Generate one specific question that can ONLY be answered using the document below. "
            "Avoid generic questions.\n\nDOCUMENT:\n"
            f"{text}\n\nQUESTION:"
        )
        response = self.client.responses.create(input=prompt, model=self.model_q_gen)
        try:
            return response.output[0].content[0].text.strip()
        except Exception:  # noqa: BLE001
            return "What unique claim does this document make?"

    def build_eval_set(self, pdf_paths: List[str]) -> List[Dict[str, str]]:
        rows: List[Dict[str, str]] = []
        for path in tqdm(pdf_paths, desc="Generating questions"):
            question = self.generate_question_from_text(self.extract_text(path))
            rows.append({"query": question, "_id": os.path.basename(path)})
        return rows

    def safe_get_file_search_annotations(self, response: Any) -> List[Dict[str, Any]]:
        annotations: List[Dict[str, Any]] = []
        try:
            for block in getattr(response, "output", []):
                for item in getattr(block, "content", []) or []:
                    if hasattr(item, "annotations") and item.annotations:
                        annotations.extend(item.annotations)
                    if hasattr(item, "file_search_call") and item.file_search_call:
                        search_results = getattr(item.file_search_call, "search_results", None)
                        if search_results:
                            annotations.extend(
                                [{"filename": result.filename, "score": result.score} for result in search_results]
                            )
        except Exception:  # noqa: BLE001
            pass
        return annotations

    def file_search_answer(self, vector_store_id: str, query: str, k: Optional[int] = None) -> List[str]:
        max_results = k or self.top_k
        response = self.client.responses.create(
            input=query,
            model=self.model_qa,
            tools=[{"type": "file_search", "vector_store_ids": [vector_store_id], "max_num_results": max_results}],
            tool_choice="required",
        )
        annotations = self.safe_get_file_search_annotations(response)
        files: List[str] = []
        for annotation in annotations:
            filename = annotation.get("filename") if isinstance(annotation, dict) else getattr(annotation, "filename", None)
            if filename:
                files.append(filename)

        ordered: List[str] = []
        seen = set()
        for filename in files:
            if filename not in seen:
                ordered.append(filename)
                seen.add(filename)
        return ordered[:max_results]

    def evaluate(self, rows: List[Dict[str, str]], vector_store_id: str, k: Optional[int] = None) -> Dict[str, float]:
        max_results = k or self.top_k
        total = len(rows)
        correct = 0
        rr_sum = 0.0
        ap_sum = 0.0

        for row in tqdm(rows, desc="Evaluating"):
            query = row["query"]
            expected = row["_id"]
            retrieved = self.file_search_answer(vector_store_id, query, max_results)
            if expected in retrieved:
                rank = retrieved.index(expected) + 1
                correct += 1
                rr_sum += 1.0 / rank
                ap_sum += 1.0 / rank

        recall_at_k = correct / total if total else 0.0
        precision_at_k = recall_at_k
        mrr = rr_sum / total if total else 0.0
        map_k = ap_sum / total if total else 0.0

        return {
            f"Recall@{max_results}": round(recall_at_k, 4),
            f"Precision@{max_results}": round(precision_at_k, 4),
            "MRR": round(mrr, 4),
            "MAP": round(map_k, 4),
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build and evaluate OpenAI vector stores from PDF corpora")
    parser.add_argument("--pdf-dir", default="openai_blog_pdfs", help="Directory containing PDF files to upload")
    parser.add_argument("--store-name", default="openai_blog_store", help="Name for the created vector store")
    parser.add_argument("--model-qa", default=DEFAULT_MODEL_QA, help="Model used for retrieval QA")
    parser.add_argument("--model-q-gen", default=DEFAULT_MODEL_Q_GEN, help="Model used for question generation")
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K, help="Number of search results to request")
    parser.add_argument(
        "--max-workers", type=int, default=DEFAULT_MAX_WORKERS, help="Concurrency level for PDF uploads"
    )
    parser.add_argument("--build-store", action="store_true", help="Create the store and upload PDFs")
    parser.add_argument("--search-query", help="Run a quick vector search using the given query")
    parser.add_argument(
        "--generate-eval", action="store_true", help="Generate question set based on all PDFs in the directory"
    )
    parser.add_argument("--run-eval", action="store_true", help="Evaluate retrieval performance using the generated set")
    parser.add_argument("--eval-output", default="eval_set.json", help="Where to write the generated evaluation set")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pipeline = VectorStorePipeline(
        pdf_dir=args.pdf_dir,
        store_name=args.store_name,
        model_qa=args.model_qa,
        model_q_gen=args.model_q_gen,
        top_k=args.top_k,
        max_workers=args.max_workers,
    )

    vector_store_info: Optional[Dict[str, Any]] = None

    if args.build_store:
        vector_store_info = pipeline.build_store_and_upload()
    elif args.run_eval or args.search_query:
        raise RuntimeError("--build-store must be provided to create a store before search or eval")

    if args.search_query and vector_store_info:
        search_results = pipeline.vector_search(vector_store_info["vector_store"]["id"], args.search_query, args.top_k)
        print(json.dumps(search_results, indent=2))

    if args.generate_eval:
        files = pipeline.list_pdfs()
        eval_rows = pipeline.build_eval_set(files)
        with open(args.eval_output, "w", encoding="utf-8") as handle:
            json.dump(eval_rows, handle, indent=2)
        print(f"Wrote evaluation set to {args.eval_output}")

    if args.run_eval:
        if not vector_store_info:
            raise RuntimeError("Cannot run evaluation without creating a vector store in this invocation")
        with open(args.eval_output, "r", encoding="utf-8") as handle:
            rows = json.load(handle)
        metrics = pipeline.evaluate(rows, vector_store_info["vector_store"]["id"], args.top_k)
        print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
