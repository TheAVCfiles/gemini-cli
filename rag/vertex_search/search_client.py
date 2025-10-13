"""Utilities for querying Vertex AI Search Discovery Engine indices.

This module centralizes construction of the Discovery Engine client and
serving config paths so that both ingestion scripts and agent runtimes can
issue search requests without duplicating boilerplate.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1
from google.protobuf.json_format import MessageToDict


@dataclass(frozen=True)
class VertexSearchConfig:
    """Configuration required to contact a Vertex AI Search data store."""

    project_id: str
    location: str
    data_store_id: str
    serving_config_id: str = "default_config"

    @property
    def serving_config(self) -> str:
        """Return the fully-qualified Discovery Engine serving config path."""

        return (
            f"projects/{self.project_id}/locations/{self.location}/"
            f"dataStores/{self.data_store_id}/servingConfigs/{self.serving_config_id}"
        )

    @property
    def client_options(self) -> ClientOptions | None:
        """Return client options that respect non-global regions."""

        if self.location and self.location != "global":
            return ClientOptions(
                api_endpoint=f"{self.location}-discoveryengine.googleapis.com"
            )
        return None


def query_vertex_search(
    query: str,
    *,
    config: VertexSearchConfig,
    page_size: int = 10,
    filter: str | None = None,
    offset: int | None = None,
) -> discoveryengine_v1.SearchResponse:
    """Execute a search request against Vertex AI Search."""

    client = discoveryengine_v1.SearchServiceClient(
        client_options=config.client_options
    )

    request_kwargs: Dict[str, Any] = {
        "serving_config": config.serving_config,
        "query": query,
        "page_size": page_size,
    }
    if filter:
        request_kwargs["filter"] = filter
    if offset is not None:
        request_kwargs["offset"] = offset

    request = discoveryengine_v1.SearchRequest(**request_kwargs)
    return client.search(request=request)


def to_python_dict(message: Any | None) -> Dict[str, Any]:
    """Convert Discovery Engine protobuf messages into JSON-friendly dicts."""

    if not message:
        return {}
    proto = getattr(message, "_pb", message)
    return MessageToDict(proto, preserving_proto_field_name=True)
