"""LangGraph-compatible retriever that streams Vertex AI Search results.

The Gemini CLI agent templates expect retrievers to expose a ``stream`` method
that yields context documents one by one. This stub wraps the lower-level
``query_vertex_search`` helper and normalises the Discovery Engine results into
simple dictionaries that are easy to append to an agent state.
"""

from __future__ import annotations

from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from typing import Any, Dict, List, MutableMapping

from google.cloud import discoveryengine_v1

from .search_client import VertexSearchConfig, query_vertex_search, to_python_dict


def _extract_snippets(result: discoveryengine_v1.SearchResponse.SearchResult) -> List[str]:
    snippets: List[str] = []
    snippet_info = getattr(result, "snippet_info", None)
    if not snippet_info:
        return snippets
    for snippet in getattr(snippet_info, "snippets", []) or []:
        value = getattr(snippet, "value", None)
        if value:
            snippets.append(value)
    return snippets


def _document_payload(document: discoveryengine_v1.Document) -> Dict[str, Any]:
    payload: Dict[str, Any] = {}
    for field_name in ("struct_data", "derived_struct_data"):
        payload.update(to_python_dict(getattr(document, field_name, None)))
    if getattr(document, "content", None):
        payload.setdefault("content", document.content)
    if getattr(document, "uri", None):
        payload.setdefault("uri", document.uri)
    return payload


@dataclass
class VertexSearchRetriever:
    """Streams Vertex AI Search documents into LangGraph agent state."""

    config: VertexSearchConfig
    top_k: int = 5
    metadata_key: str = "vertex_search_context"

    def invoke(self, query: str) -> List[Dict[str, Any]]:
        """Return the top ``k`` results for ``query`` as context documents."""

        return list(self.stream(query))

    def stream(self, query: str) -> Iterator[Dict[str, Any]]:
        """Yield documents one-by-one so LangGraph can stream them into memory."""

        response = query_vertex_search(query, config=self.config, page_size=self.top_k)
        results: Iterable[Any] = getattr(response, "results", response)
        count = 0
        for result in results:
            if count >= self.top_k:
                break
            document = getattr(result, "document", None)
            if not document:
                continue
            payload = _document_payload(document)
            snippets = _extract_snippets(result)
            yield {
                "id": getattr(document, "id", getattr(result, "id", None)),
                "metadata": payload,
                "snippets": snippets,
            }
            count += 1

    def update_state(self, state: MutableMapping[str, Any], query: str) -> MutableMapping[str, Any]:
        """Utility helper for LangGraph nodes.

        ``state`` is mutated in-place to append streamed documents under
        ``metadata_key`` and returned so this method can be used as a node
        callable inside ``StateGraph.add_node``.
        """

        context: List[Dict[str, Any]] = list(state.get(self.metadata_key, []))
        context.extend(self.stream(query))
        state[self.metadata_key] = context
        return state
