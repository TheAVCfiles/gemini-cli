import argparse
import json
from pathlib import Path


def generate_sample_docs(output_filename: str):
    """Generates a JSONL file with sample documents."""

    documents = [
        {
            "id": "doc_1",
            "structData": {
                "title": "Introduction to RAG",
                "source": "internal_wiki",
            },
            "content": (
                "Retrieval-Augmented Generation (RAG) is an architecture that "
                "retrieves facts from an external knowledge base to ground large "
                "language models (LLMs) on authoritative sources. This helps "
                "mitigate hallucinations and provides verifiable citations."
            ),
        },
        {
            "id": "doc_2",
            "structData": {
                "title": "Vertex AI Search Benefits",
                "source": "gcp_docs",
            },
            "content": (
                "Vertex AI Search (powered by Discovery Engine) provides "
                "robust, enterprise-grade search capabilities, including "
                "semantic search, embedding generation, and scalable indexing, "
                "making it ideal for RAG pipelines within Google Cloud "
                "environments."
            ),
        },
        {
            "id": "doc_3",
            "structData": {
                "title": "Configuration Steps",
                "source": "deployment_guide",
            },
            "content": (
                "To set up Vertex AI Search, you must first create a Data Store, "
                "then import your documents via a GCS bucket using the JSONL "
                "format. Finally, you can use the SearchService client to query "
                "the indexed data."
            ),
        },
    ]

    print(f"Generating {len(documents)} sample documents to '{output_filename}'...")

    output_path = Path(output_filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as file:
        for doc in documents:
            file.write(json.dumps(doc) + "\n")

    print(f"Successfully created {output_filename}. Ready for GCS upload.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate sample documents for Discovery Engine import.",
    )
    parser.add_argument("--out", default="docs.jsonl", help="Output filename.")

    args = parser.parse_args()
    generate_sample_docs(args.out)
