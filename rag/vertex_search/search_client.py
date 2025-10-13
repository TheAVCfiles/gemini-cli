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
