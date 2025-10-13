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
