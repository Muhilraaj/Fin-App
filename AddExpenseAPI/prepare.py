# -*- coding: utf-8 -*-
"""
Created on Sun Jan  1 12:22:42 2023

@author: ma185418
"""

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
#df=pd.read_excel('M:\My Project\MyFinApp\Budget.xlsx',sheet_name='Expenses')
#df=df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
df=[]

def customHash(data):
    data=str(data)
    hash_obj = hashlib.sha256()
    hash_obj.update(data.encode())
    return hash_obj.hexdigest()

def DeleteAllUsers():
    # Delete all documents in the container
    query = "SELECT * FROM c"
    container=database.get_container_client('On-Behalf')
    #items = list(container.query_items(query=query, partition_key=None))
    item_list = list(container.read_all_items())

    for item in item_list:
        response=container.delete_item(item, partition_key=item['id'])
        print(response)

def DeleteAllLabels():
    # Delete all documents in the container
    query = "SELECT * FROM c"
    container=database.get_container_client('Label')
    #items = list(container.query_items(query=query, partition_key=None))
    item_list = list(container.read_all_items())

    for item in item_list:
        response=container.delete_item(item, partition_key=item['id'])
        print(response)

def DeleteAllExpense():
    # Delete all documents in the container
    query = "SELECT * FROM c"
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    #items = list(container.query_items(query=query, partition_key=None))
    item_list = list(container.read_all_items())

    for item in item_list:
        response=container.delete_item(item, partition_key=item['id'])
        print(response)

def InsertCosmos(data):
   try:
       data=dict(data)
       data=json.dumps(data)
       container.create_item(json.loads(data))
       print("Inserted")
   except Exception as e:
       print(e)

    

def PrepareLabel():
    Labels=df.loc[:,['L1','L2','L3']].applymap(lambda x:x.strip() if isinstance(x,str) else x).drop_duplicates().dropna()
    Labels['id']=Labels.apply(lambda x:str(customHash(x['L1']+x['L2']+x['L3'])),axis=1)  
    Labels.apply(InsertCosmos,axis=1)

def AddLabel(data):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('Label')
    data["id"]=customHash(data['L1']+data['L2']+data['L3'])
    data["pk"]=1
    InsertCosmos(data)

def AddUser(data):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('On-Behalf')
    data["id"]=customHash(data['On-Behalf'])
    data["pk"]=1
    InsertCosmos(data)

def AddIncomeLabel(data):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('Income_Label')
    data["id"]=customHash(data['L1']+data['L2'])
    data["pk"]=1
    InsertCosmos(data)
    
def PrepareUser():
    global container
    User=df.applymap(lambda x:x.strip() if isinstance(x,str) else x).drop_duplicates().dropna()
    User['id']=User.apply(lambda x:str(customHash(x['On-Behalf'])),axis=1)
    container=database.get_container_client('On-Behalf')
    User.apply(InsertCosmos,axis=1)

def DeleteExpense(id):
    global container,database
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    query = "SELECT * FROM c WHERE c.id = '%s'"%id
    result = list(container.query_items(query, enable_cross_partition_query=True))
    container.delete_item(item=result[0], partition_key=1)

def DeleteLabel(id):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('Label')
    query = "SELECT * FROM c WHERE c.id = '%s'"%id
    result = list(container.query_items(query, enable_cross_partition_query=True))
    container.delete_item(item=result[0], partition_key=1)

def DeleteIncomeLabel(id):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('Income_Label')
    query = "SELECT * FROM c WHERE c.id = '%s'"%id
    result = list(container.query_items(query, enable_cross_partition_query=True))
    container.delete_item(item=result[0], partition_key=1)

def DeleteUser(id):
    global container,database
    database=client.get_database_client('DIM')
    container=database.get_container_client('On-Behalf')
    query = "SELECT * FROM c WHERE c.id = '%s'"%id
    result = list(container.query_items(query, enable_cross_partition_query=True))
    container.delete_item(item=result[0],partition_key=1)

def DeleteIncome(id):
    global container,database
    database=client.get_database_client('Fact')
    container=database.get_container_client('Income')
    query = "SELECT * FROM c WHERE c.id = '%s'"%id
    result = list(container.query_items(query, enable_cross_partition_query=True))
    container.delete_item(item=result[0],partition_key=1)
    
def InsertExpense():
    global container,database
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    dd={'Expense_Note': 'Gold', 'Label_key': '7fb2eee6d2fa0e85dcc1466c5fc482c22fe7dbf1b25c6bc231f66d0dcac0cc15', 'User_key': '86605cac7f0646867f62ff0f03ca6af9dc3ce860f772a8673cdb6cd34dffc3b1', 'Timestamp': '2023-03-15 00:00:00', 'Expense': 11780.0, 'id': '739078a61a69f08bb32fad30a22d1a3821469b937af27fd82e41784a53862094', '_rid': 'qsZLANcR0tOXAwAAAAAAAA==', '_self': 'dbs/qsZLAA==/colls/qsZLANcR0tM=/docs/qsZLANcR0tOXAwAAAAAAAA==/', '_etag': '"60005187-0000-0700-0000-642c77320000"', '_attachments': 'attachments/', '_ts': 1680635698}
    dd['User_key']='85bc0f95858d757232c2f3662d3edb11168ddbfb426bfc240b478dc444308c9b'
    dd['id']=customHash(str(dd['Timestamp'])+dd['Label_key']+dd['User_key'])
    InsertCosmos(dd)

def PrepareExpense():
    global container,database
    expense=df.rename(columns={'Expense':'Expense_Note','22-Aug':'15/08/2022','22-Sep':'15/09/2022','Oct-22':'15/10/2022','Nov-22':'15/11/2022','Dec-22':'15/12/2022','Jan-23':'15/01/2023','23-Feb':'15/02/2023','Mar-23':'15/03/2023'})
    expense['Label_key']=expense.apply(lambda x:str(customHash(x['L1']+x['L2']+x['L3'])),axis=1) 
    expense['User_key']= expense.apply(lambda x:str(customHash(x['On-Behalf'])),axis=1)
    expense=expense.drop(['L1','L2','L3','On-Behalf','Name'],axis=1)
    expense=expense.melt(id_vars=['Expense_Note','Label_key','User_key'],var_name='Timestamp',value_name='Expense').dropna()
    expense=expense.loc[(expense['Expense']!=0) & (expense['Expense_Note']!='Total')]
    expense['Timestamp']=pd.to_datetime(expense['Timestamp'],format='%d/%m/%Y').dt.strftime('%Y-%m-%d %H:%M:%S')
    expense['id']=expense.apply(lambda x:str(customHash(str(x['Timestamp'])+x['Label_key']+x['User_key'])),axis=1)
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    expense.apply(InsertCosmos,axis=1)

def UpdateExpense(id,key,value):
    global container,database
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    query = "SELECT * FROM c WHERE c.id = '%s' and c.pk=1"%id
    items= list(container.read_all_items())
    result=''
    for i in items:
        if i['id']==id:
            result=i
    result[key]=value
    container.replace_item(item=result,body=result)
    


'''data={
    "L1":"Others",
    "L2":"Tax",
    "L3":"Short Term Capital Gain Tax"
}
AddLabel(data)'''




UpdateExpense('6be57da0574a4d89b44ef166cf41ff4e0ad02c0aa270c1bfa490315c31ca51d6','User_key','86605cac7f0646867f62ff0f03ca6af9dc3ce860f772a8673cdb6cd34dffc3b1')
#DeleteLabel('8b7272278a5676b33596cfe1b1f13de1c4145589ddce1ac642346022c425da4e')
