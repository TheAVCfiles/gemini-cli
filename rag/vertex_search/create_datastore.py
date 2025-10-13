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
