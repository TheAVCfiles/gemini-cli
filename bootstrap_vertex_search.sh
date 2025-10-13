#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-your-gcp-project}"
LOCATION="${LOCATION:-global}"
DATA_STORE_ID="${DATA_STORE_ID:-your-data-store}"
GCS_BUCKET="${GCS_BUCKET:-gs://your-ingest-bucket}"
PYTHON="${PYTHON:-python3}"

cat <<VARS
Using:
 PROJECT_ID=$PROJECT_ID
 LOCATION=$LOCATION
 DATA_STORE_ID=$DATA_STORE_ID
 GCS_BUCKET=$GCS_BUCKET
 PYTHON=$PYTHON
VARS

mkdir -p rag/ingest rag/vertex_search rag/eval
[ -f rag/eval/playground.ipynb ] || touch rag/eval/playground.ipynb

cat <<EOF_CONF > config.yaml
project_id: ${PROJECT_ID}
location: ${LOCATION}

vertex_ai_search:
  data_store_id: ${DATA_STORE_ID}
  serving_config: default_config
  api_endpoint_override: ""

agent:
  backend: agentic_rag
  rag:
    retriever: vertex_ai_search
    top_k: 5
    return_snippets: false
    include_citations: true
EOF_CONF

mkdir -p rag

cat <<'EOF_README' > rag/README.md
Vertex AI Search (Discovery Engine) scaffold
===========================================

Quick start
-----------

# Auth & project
gcloud auth application-default login
gcloud config set project $PROJECT_ID

# Install deps
python3 -m venv .venv && source .venv/bin/activate
pip install -U google-cloud-discoveryengine google-api-core

# (Optional) create the Data Store (or do it in Console)
python rag/vertex_search/create_datastore.py --project $PROJECT_ID --location $LOCATION --data-store $DATA_STORE_ID

# Prepare small demo docs -> JSONL and upload to GCS
python rag/ingest/prepare_docs.py --out docs.jsonl
gsutil cp docs.jsonl $GCS_BUCKET/docs.jsonl

# Import docs to Discovery Engine
python rag/vertex_search/import_docs.py --project $PROJECT_ID --location $LOCATION --data-store $DATA_STORE_ID --gcs-uri $GCS_BUCKET/docs.jsonl

# Query
python rag/vertex_search/search_client.py --project $PROJECT_ID --location $LOCATION --data-store $DATA_STORE_ID --q "hello world"
EOF_README

cat <<'EOF_CREATE' > rag/vertex_search/create_datastore.py
import argparse

from google.cloud import discoveryengine_v1 as discoveryengine


def create_data_store(project_id: str, location: str, data_store_id: str):
    """Creates a Discovery Engine Data Store."""

    client_options = {}
    if location != "global":
        client_options["api_endpoint"] = f"{location}-discoveryengine.googleapis.com"

    client = discoveryengine.DataStoreServiceClient(client_options=client_options)

    parent = client.collection_path(
        project=project_id,
        location=location,
        collection="default_collection",
    )

    data_store = discoveryengine.DataStore(
        display_name=f"RAG Data Store for {data_store_id}",
        industry_vertical=discoveryengine.DataStore.IndustryVertical.OTHER,
        solution_types=[discoveryengine.SolutionType.SOLUTION_TYPE_SEARCH],
        content_config=discoveryengine.DataStore.ContentConfig.NO_CONTENT,
    )

    print(f"Attempting to create Data Store '{data_store_id}' in {location}...")

    try:
        existing_ds = client.get_data_store(
            name=client.data_store_path(
                project=project_id,
                location=location,
                collection="default_collection",
                data_store=data_store_id,
            )
        )
        print(f"Data Store '{data_store_id}' already exists.")
        return existing_ds
    except Exception:
        pass

    try:
        operation = client.create_data_store(
            parent=parent,
            data_store=data_store,
            data_store_id=data_store_id,
        )

        print("Data Store creation operation started. Waiting for completion...")
        response = operation.result()
        print(f"Data Store created successfully: {response.name}")
        return response

    except Exception as exc:  # noqa: BLE001
        print(f"An error occurred during Data Store creation: {exc}")
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create a Vertex AI Search Data Store.",
    )
    parser.add_argument("--project", required=True, help="Your GCP project ID.")
    parser.add_argument(
        "--location",
        default="global",
        help="The location of the data store (e.g., 'global' or 'us-central1').",
    )
    parser.add_argument(
        "--data-store", required=True, help="The desired ID for the Data Store."
    )

    args = parser.parse_args()

    create_data_store(args.project, args.location, args.data_store)
EOF_CREATE

cat <<'EOF_PREP' > rag/ingest/prepare_docs.py
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
EOF_PREP

cat <<'EOF_IMPORT' > rag/vertex_search/import_docs.py
import argparse

from google.api_core import exceptions
from google.cloud import discoveryengine_v1 as discoveryengine


def import_documents(project_id: str, location: str, data_store_id: str, gcs_uri: str):
    """Imports documents from GCS into the specified Data Store."""

    client_options = {}
    if location != "global":
        client_options["api_endpoint"] = f"{location}-discoveryengine.googleapis.com"

    client = discoveryengine.DocumentServiceClient(client_options=client_options)

    parent = client.branch_path(
        project=project_id,
        location=location,
        collection="default_collection",
        data_store=data_store_id,
        branch="default_branch",
    )

    input_config = discoveryengine.ImportDocumentsRequest.InputConfig(
        gcs_source=discoveryengine.GcsSource(
            input_uris=[gcs_uri],
            data_schema="jsonl",
        )
    )

    request = discoveryengine.ImportDocumentsRequest(
        parent=parent,
        input_config=input_config,
        reconciliation_mode=
        discoveryengine.ImportDocumentsRequest.ReconciliationMode.FULL,
    )

    print(f"Starting import job from {gcs_uri} to Data Store '{data_store_id}'...")

    try:
        operation = client.import_documents(request=request)

        print(
            "Import operation started. Waiting for completion (this may take several minutes)..."
        )
        response = operation.result()

        print("Import finished.")
        summary = response.summary
        total = summary.success_count + summary.failure_count
        print(f"Total documents processed: {total}")
        print(f"Successful imports: {summary.success_count}")
        if summary.failure_count > 0:
            print(f"Failed imports: {summary.failure_count}")
            print("Check the Discovery Engine Console for detailed error logs.")

    except exceptions.NotFound:
        print(f"Error: Data Store '{data_store_id}' not found. Please create it first.")
    except Exception as exc:  # noqa: BLE001
        print(f"An unexpected error occurred during import: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Import documents into a Discovery Engine Data Store.",
    )
    parser.add_argument("--project", required=True, help="Your GCP project ID.")
    parser.add_argument(
        "--location", default="global", help="The location of the data store."
    )
    parser.add_argument(
        "--data-store", required=True, help="The ID of the Data Store."
    )
    parser.add_argument(
        "--gcs-uri",
        required=True,
        help="The GCS path to the input JSONL file (e.g., gs://my-bucket/docs.jsonl).",
    )

    args = parser.parse_args()
    import_documents(args.project, args.location, args.data_store, args.gcs_uri)
EOF_IMPORT

cat <<'EOF_SEARCH' > rag/vertex_search/search_client.py
import argparse

from google.cloud import discoveryengine_v1 as discoveryengine


def search_data_store(project_id: str, location: str, data_store_id: str, query: str):
    """Performs a search query against the Data Store."""

    client_options = {}
    if location != "global":
        client_options["api_endpoint"] = f"{location}-discoveryengine.googleapis.com"

    client = discoveryengine.SearchServiceClient(client_options=client_options)

    serving_config = client.serving_config_path(
        project=project_id,
        location=location,
        collection="default_collection",
        data_store=data_store_id,
        serving_config="default_config",
    )

    request = discoveryengine.SearchRequest(
        serving_config=serving_config,
        query=query,
        page_size=5,
        query_params=discoveryengine.SearchRequest.QueryParameters(
            return_snippet=True,
            search_templates=[
                discoveryengine.SearchRequest.QueryParameters.SearchTemplate(
                    engine_name="search"
                )
            ],
        ),
        user_info=discoveryengine.UserInfo(user_id="test-user-123"),
    )

    print(f"Querying Data Store '{data_store_id}' for: '{query}'")

    try:
        response = client.search(request=request)

        print("\n--- Search Results ---")
        results = list(response.results)
        if not results:
            print("No results found.")
            return

        for index, result in enumerate(results, start=1):
            document = result.document
            doc_id = document.name.split("/")[-1]
            title = document.struct_data.get("title") if document.struct_data else "N/A"

            print(f"\n[{index}] Document ID: {doc_id}")
            print(f"    Title: {title}")

            derived = document.derived_struct_data or {}
            snippets = derived.get("snippets", [])
            if snippets:
                snippet_text = snippets[0].get("snippet", "")
                print(f"    Snippet: {snippet_text}")
            elif document.content:
                print(f"    Content: {document.content[:150]}...")
            else:
                print("    No content available.")

    except Exception as exc:  # noqa: BLE001
        print(f"An error occurred during search: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Query a Vertex AI Search Data Store.",
    )
    parser.add_argument("--project", required=True, help="Your GCP project ID.")
    parser.add_argument(
        "--location", default="global", help="The location of the data store."
    )
    parser.add_argument(
        "--data-store", required=True, help="The ID of the Data Store."
    )
    parser.add_argument("--q", required=True, help="The query string.")

    args = parser.parse_args()
    search_data_store(args.project, args.location, args.data_store, args.q)
EOF_SEARCH

chmod +x bootstrap_vertex_search.sh
