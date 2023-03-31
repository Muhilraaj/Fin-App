import logging
import json
import os

import azure.functions as func
from azure.storage.blob import BlobServiceClient, BlobClient
from azure.cosmos import CosmosClient

headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

def handle_labels():
    blob_service_client = BlobServiceClient.from_connection_string(os.environ['Storage_Account_String'])
    container_name = os.environ["Storage_Account_Container_Name"]
    blob_name = os.environ["Storage_Account_Blob_Name"]
    blob_client = blob_service_client.get_blob_client(container_name, blob_name)
    json_data = json.loads(blob_client.download_blob().readall())
    json_data = json.dumps(json_data)
    return func.HttpResponse(body=str(json_data),headers=headers, mimetype="application/json")

def handle_user():
    client = CosmosClient(url=os.environ["Cosmos_DB_Endpoint"], credential=os.environ["Cosmos_DB_Key"])
    database=client.get_database_client('DIM')
    container=database.get_container_client('On-Behalf')
    query = '''SELECT c["On-Behalf"] FROM c'''
    user_list = container.query_items(query=query, enable_cross_partition_query=True)
    users = []
    for item in user_list:
        users.append(item)
    users = json.dumps(users)
    return func.HttpResponse(str(users),headers=headers,mimetype="application/json")

def main(req: func.HttpRequest) -> func.HttpResponse:
    method = req.method.lower()
    path = req.route_params.get('path', 'user').lower()
    if req.method == "OPTIONS":
        return func.HttpResponse(
            headers=headers,
            status_code=204
        )
    elif method == 'get' and path == 'user':
        return handle_user()
    elif method == 'get' and path == 'labels':
        return handle_labels()
    else:
        return func.HttpResponse("Not Found", status_code=404)
