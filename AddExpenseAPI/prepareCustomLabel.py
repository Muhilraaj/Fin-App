import pandas as pd
import json
from azure.cosmos import CosmosClient, PartitionKey
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

endpoint=os.getenv('azcosmos_endpoint')
key=os.getenv('azcosmos_key')

client = CosmosClient(url=endpoint, credential=key)
database=client.get_database_client('DIM')
container=database.get_container_client('Label')

def customHash(data):
    data=str(data)
    hash_obj = hashlib.sha256()
    hash_obj.update(data.encode())
    return hash_obj.hexdigest()

def InsertCosmos(data):
   try:
       data=dict(data)
       data=json.dumps(data)
       container.create_item(json.loads(data))
       print("Inserted")
   except Exception as e:
       print(e)

def LoadCustomLabelCSV(filename):
    Labels=pd.read_csv(filename)
    Labels=Labels.applymap(lambda x:x.strip() if isinstance(x,str) else x).drop_duplicates().dropna()
    Labels=Labels.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    Labels['id']=Labels.apply(lambda x:str(customHash(x['L1']+x['L2']+x['L3']+x['Custom'])),axis=1)  
    Labels['Active']='Y'
    Labels['pk']=1
    print(Labels)
    Labels.apply(InsertCosmos,axis=1)

def DeleteLabel(id):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('Label')
    query = "SELECT * FROM c WHERE c.id = '%s'"%id
    result = list(container.query_items(query, enable_cross_partition_query=True))
    container.delete_item(item=result[0], partition_key=1)

def AddCustomLabel(data):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('Label')
    data["id"]=customHash(data['L1']+data['L2']+data['L3']+data['Custom'])
    data["pk"]=1
    data['Active']='Y'
    InsertCosmos(data)

data={
    "L1":"Other",
    "L2":"Debth",
    "L3":"Interest",
    "Custom": "Construction"
}

AddCustomLabel(data)
#DeleteLabel('689b2cc5f2b17ed01d279b724f9e8ff0a339c2f29929985cfec3d4c50eb0b678')