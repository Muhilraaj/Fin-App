import logging
import json
import os

import azure.functions as func
from azure.storage.blob import BlobServiceClient, BlobClient
from azure.cosmos import CosmosClient
import datetime
import hashlib

headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

def customHash(data):
    data=str(data)
    hash_obj = hashlib.sha256()
    hash_obj.update(data.encode())
    return hash_obj.hexdigest()

def getLabels():
    blob_service_client = BlobServiceClient.from_connection_string(os.environ['Storage_Account_String'])
    container_name = os.environ["Storage_Account_Container_Name"]
    blob_name = os.environ["Storage_Account_Blob_Name"]
    blob_client = blob_service_client.get_blob_client(container_name, blob_name)
    json_data = json.loads(blob_client.download_blob().readall())
    json_data = json.dumps(json_data)
    return func.HttpResponse(body=str(json_data),headers=headers, mimetype="application/json")

def getUser():
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

def postExpense(data):
    d={}
    d['Expense']=data['Expense']
    d['Expense_Note']=data['Expense_Note']
    format = '%m / %d / %Y %I:%M %p'
    d['Timestamp']=str(datetime.datetime.strptime(data['Timestamp'], format))
    d['Label_key']=str(customHash(data['L1']+data['L2']+data['L3']))
    d['User_key']=str(customHash(data['Onbehalf']))
    d['id']=str(customHash(str(d['Timestamp'])+d['Label_key']+d['User_key']))
    client = CosmosClient(url=os.environ["Cosmos_DB_Endpoint"], credential=os.environ["Cosmos_DB_Key"])
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    d=json.dumps(d)
    container.create_item(json.loads(d))
    return func.HttpResponse(headers=headers,status_code=202)
   



def main(req: func.HttpRequest) -> func.HttpResponse:
    method = req.method.lower()
    path = req.route_params.get('path', 'user').lower()
    if method == "OPTIONS":
        return func.HttpResponse(headers=headers,status_code=204)
    elif method == 'get' and path == 'user':
        return getUser()
    elif method == 'get' and path == 'labels':
        return getLabels()
    elif method == 'post' and path == 'expense':
        try:
            body=req.get_json()
            return postExpense(body)
        except Exception as e:
            print(e)
            return func.HttpResponse(headers=headers,status_code=400)

    else:
        return func.HttpResponse("Not Found", status_code=404)
