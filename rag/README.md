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
