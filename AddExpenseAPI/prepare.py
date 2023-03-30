# -*- coding: utf-8 -*-
"""
Created on Sun Jan  1 12:22:42 2023

@author: ma185418
"""

import pandas as pd
import json
from azure.cosmos import CosmosClient, PartitionKey

endpoint='https://myfin-db.documents.azure.com:443/'
key='UCrkusJL9E4oI2KUgsFd4vyZLDb2xHtYgxojCBmK3Uz8YiWklE8vWXSIRDAUVDNANb1JSsaTItKmACDbI1s9yg=='

client = CosmosClient(url=endpoint, credential=key)
database=client.get_database_client('DIM')
container=database.get_container_client('Label')
df=pd.read_excel('M:\My Project\MyFinApp\Budget.xlsx',sheet_name='Expenses')


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
    Labels['id']=Labels.apply(lambda x:str(hash(x['L1']+x['L2']+x['L3'])),axis=1)  
    Labels.apply(InsertCosmos,axis=1)
    
def PrepareUser():
    global container
    User=df.applymap(lambda x:x.strip() if isinstance(x,str) else x).drop_duplicates().dropna()
    User['id']=User.apply(lambda x:str(hash(x['On-Behalf'])),axis=1)
    container=database.get_container_client('On-Behalf')
    User.apply(InsertCosmos,axis=1)
    
  
def PrepareExpense():
    global container,database
    expense=df.rename(columns={'Expense':'Expense_Note','22-Aug':'15/08/2022','22-Sep':'15/09/2022','Oct-22':'15/10/2022','Nov-22':'15/11/2022','Dec-22':'15/12/2022','Jan-23':'15/01/2023','23-Feb':'15/02/2023'})
    expense['Label_key']=expense.apply(lambda x:str(hash(x['L1']+x['L2']+x['L3'])),axis=1) 
    expense['User_key']= expense.apply(lambda x:str(hash(x['On-Behalf'])),axis=1)
    expense=expense.drop(['L1','L2','L3','On-Behalf','Name'],axis=1)
    expense=expense.melt(id_vars=['Expense_Note','Label_key','User_key'],var_name='Timestamp',value_name='Amount').dropna()
    expense=expense.loc[(expense['Amount']!=0) & (expense['Expense_Note']!='Total')]
    expense['Timestamp']=pd.to_datetime(expense['Timestamp'],format='%d/%m/%Y').dt.strftime('%Y-%m-%d %H:%M:%S')
    expense['id']=expense.apply(lambda x:str(hash(str(x['Timestamp'])+x['Label_key']+x['User_key'])),axis=1)
    database=client.get_database_client('Fact')
    container=database.get_container_client('Expense')
    expense.apply(InsertCosmos,axis=1)
    

DeleteAllExpense()
PrepareExpense()




