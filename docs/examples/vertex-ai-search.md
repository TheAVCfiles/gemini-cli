# Integrate Vertex AI Search with Gemini CLI agents

This guide walks you through connecting a Gemini CLI project to [Vertex AI Search](https://cloud.google.com/generative-ai-app-builder/docs/overview-search) so your agent can ground its answers in an enterprise search index. It mirrors what `gemini enhance --add vertex-search` scaffolds for you and can be used whether you run the command directly or want to understand what happens under the hood.

## 1. Enable Vertex AI Search

1. Enable the **Vertex AI API** and **Vertex AI Search** for your Google Cloud project.
2. Create a Search index using the Vertex AI console, Terraform, or the REST API. Take note of the project, location, and index identifiers—you will reference them later when wiring the client.

## 2. Prepare your data

Vertex AI Search supports JSON Lines (`.jsonl`), CSV, and raw text. You can prepare data manually, but Gemini CLI also exposes a Retrieval-Augmented Generation (RAG) pipeline that chunkifies and uploads your data for you.

```bash
# From your Gemini CLI project root
npm run gemini -- enhance --add vertex-search
```

Running the enhancement scaffolds the following pieces:

- **Data ingestion pipeline** that reads from your knowledge base and produces Vertex-friendly artifacts.
- **Index creation logic** so you can provision and update your search index from the command line.
- **Search client integration** with helpers that normalize results for downstream RAG flows.

> **Tip:** The generated pipeline can be customized. For large datasets, consider streaming uploads or batching to avoid memory pressure.

## 3. Configure the agent

Update your agent configuration (for example, `config.yaml`, `agent.json`, or a LangGraph node definition) to include the Vertex AI Search settings.

```yaml
vertex_ai_search:
  project_id: your-gcp-project
  location: us-central1
  index_id: your-index-id
```

If your agent uses environment variables, you can store these values in `.env` and reference them with `${PROJECT_ID}` style placeholders.

## 4. Use the generated search client

The scaffolded code typically looks similar to the following helper:

```python
from vertexai.preview.language_models import TextEmbeddingModel
from google.cloud import discoveryengine_v1beta


def query_vertex_search(query: str):
    client = discoveryengine_v1beta.SearchServiceClient()
    request = discoveryengine_v1beta.SearchRequest(
        query=query,
        serving_config=(
            "projects/your-project/locations/us-central1/"
            "dataStores/your-index-id/servingConfigs/default_config"
        ),
    )
    response = client.search(request=request)
    return response
```

You can extend this wrapper to return processed documents, include semantic ranking features, or map results onto your agent's native document schema.

### Authentication

The client uses Application Default Credentials. When working locally, run `gcloud auth application-default login`. In CI or production, attach a service account with the `Vertex AI Search Editor` role and export `GOOGLE_APPLICATION_CREDENTIALS`.

## 5. Integrate with a RAG agent

When you generate an `agentic_rag` or `langgraph_base_react` template, Gemini CLI automatically threads the Vertex AI Search responses into the agent's context window. You can customize the RAG pipeline by editing the generated orchestrator. For example, you may want to:

- Change the maximum number of retrieved documents.
- Filter by metadata before returning candidates to Gemini models.
- Append direct answer snippets in addition to context documents.

## 6. Optional enhancements

Run the following command to scaffold evaluation assets for your search experience:

```bash
npm run gemini -- ask "Add evaluation tools for Vertex AI Search"
```

The enhancement adds:

- An evaluation playground for rapid manual testing.
- Query quality metrics to track relevance over time.
- Feedback loop integration so subject-matter experts can grade answers.

## 7. Troubleshooting tips

- **Permission errors:** Confirm the service account has `discoveryengine.indexes.list` and `discoveryengine.searchConfigs.search` permissions.
- **Empty results:** Verify that documents were successfully ingested and that the index has finished processing (`Vertex AI Search` > `Data Stores` > `Ingestion history`).
- **Latency concerns:** Enable streaming retrieval or adjust the number of results if latency is too high for interactive agents.

With these steps in place, your Gemini CLI agent can rely on Vertex AI Search to ground its answers in curated knowledge while maintaining the flexibility of the Gemini toolkit.
