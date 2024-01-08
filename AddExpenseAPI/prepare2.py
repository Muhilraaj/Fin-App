# -*- coding: utf-8 -*-
"""
Created on Sat Jan 21 17:14:16 2023

@author: ma185418
"""
import pandas as pd
import copy
import json
from azure.cosmos import CosmosClient, PartitionKey
from azure.storage.blob import BlobServiceClient
import os
from dotenv import load_dotenv

load_dotenv()

endpoint=os.getenv('azcosmos_endpoint')
key=os.getenv('azcosmos_key')

client = CosmosClient(url=endpoint, credential=key)
database=client.get_database_client('DIM')
container=database.get_container_client('Label')
#df=pd.read_excel('M:\My Project\MyFinApp\Budget.xlsx',sheet_name='Expenses')

def GetAllLabels():
    # Delete all documents in the container
    query = "SELECT c.L1,c.L2,c.L3 FROM c"
    container=database.get_container_client('Label')
    #items = list(container.query_items(query=query, partition_key=None))
    item_list = list(container.read_all_items())
    return item_list

data=GetAllLabels()

ans=[]

def rec(i,n,l):
    if i==n:
        ans.append(l)
        return
    rec(i+1,n,l)
    x=l.copy()
    x[i]='*'
    rec(i+1,n,x)
    
df=pd.DataFrame(data)

dd={}
dd['*']={}
dd['*']['*']={}
dd['*']['*']['*']={'L1':['*'],'L2':['*'],'L3':['*']}
for e in data:
    try:
        dd[e['L1']][e['L2']][e['L3']]={'L1':['*'],'L2':['*'],'L3':['*']}
    except :
        try:
            dd[e['L1']][e['L2']]={'*':{'L1':['*'],'L2':['*'],'L3':['*']}}
            dd[e['L1']][e['L2']][e['L3']]={'L1':['*'],'L2':['*'],'L3':['*']}
        except:
            dd[e['L1']]={'*':{'*':{'L1':['*'],'L2':['*'],'L3':['*']}}}
            dd[e['L1']][e['L2']]={'*':{'L1':['*'],'L2':['*'],'L3':['*']}}
            dd[e['L1']][e['L2']][e['L3']]={'L1':['*'],'L2':['*'],'L3':['*']}
            
ky=['L1','L2','L3']

rec(0,3,ky)

"""            
for e in data:
    for k in ky:
        dd[e['L1']][e['L2']][e['L3']][k].append(e[k])
"""
ddt=copy.deepcopy(dd)
for f in ans:
    for e in data:
        fltr1=fltr2=fltr3=pd.Series([True]*df.size)
        k1=k2=k3='*'
        if f[0]=='L1':
            fltr1=df['L1']==e['L1']
            k1=e['L1']
        if f[1]=='L2':
            fltr2=df['L2']==e['L2']
            k2=e['L2']
        if f[2]=='L3':
            fltr3=df['L3']==e['L3']
            k3=e['L3']
        df_fltr=df.where(fltr1&fltr2&fltr3).dropna()
        for k in ky:
            try:
                #print(dd[k1][k2])
                #dd[k1][k2][k3]={}
                dd[k1][k2][k3][k]=list(set(df_fltr[k]))
            except Exception as e:
                try:
                    dd[k1][k2][k3]={}
                    dd[k1][k2][k3][k]=list(set(df_fltr[k]))
                except Exception as e:
                    dd[k1][k2]={}
                    dd[k1][k2][k3]={}
                    dd[k1][k2][k3][k]=list(set(df_fltr[k]))

with open("expense-label.json", "w") as outfile:
    json.dump(dd, outfile)
            
connection_string=os.getenv('storage_account_connection_string')
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
blob_client = blob_service_client.get_blob_client(container='json-files', blob="expense-label.json")
with open("expense-label.json", "rb") as jsonFile:
    blob_client.upload_blob(jsonFile,overwrite=True)