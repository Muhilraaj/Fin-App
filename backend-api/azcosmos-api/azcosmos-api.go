package azcosmosapi

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
)

func ExecuteQuery(databaseid string, containerid string, queryString string, partition_key int) []map[string]interface{} {
	endpoint := os.Getenv("Cosmos_DB_Endpoint")
	key := os.Getenv("Cosmos_DB_Key")

	cred, err := azcosmos.NewKeyCredential(key)
	if err != nil {
		log.Fatal("Failed to create a credential: ", err)
	}

	// Create a CosmosDB client
	client, err := azcosmos.NewClientWithKey(endpoint, cred, nil)
	if err != nil {
		log.Fatal("Failed to create Azure Cosmos DB client: ", err)
	}

	container, _ := client.NewContainer(databaseid, containerid)
	pk := azcosmos.NewPartitionKeyNumber(1)

	queryPager := container.NewQueryItemsPager(queryString, pk, nil)
	var result []map[string]interface{}

	for queryPager.More() {
		queryResponse, err := queryPager.NextPage(context.Background())
		if err != nil {
			var responseErr *azcore.ResponseError
			errors.As(err, &responseErr)
			panic(err)
		}

		for _, item := range queryResponse.Items {
			var itemResponseBody map[string]interface{}
			err = json.Unmarshal(item, &itemResponseBody)
			result = append(result, itemResponseBody)
			if err != nil {
				panic(err)
			}
		}
	}

	return result
}

func LeftJoin(firstData *[]map[string]interface{}, secondData *[]map[string]interface{}, key1 string, key2 string) *[]map[string]interface{} {
	var finalResult = make([]map[string]interface{}, 0)
	var mapSecond = make(map[string]*map[string]interface{})
	for i := 0; i < len(*secondData); i++ {
		mapSecond[(*secondData)[i][key2].(string)] = &(*secondData)[i]
	}
	for i := 0; i < len(*firstData); i++ {
		for k, v := range *mapSecond[(*firstData)[i][key1].(string)] {
			(*firstData)[i][k] = v
		}
		delete((*firstData)[i], key1)
		delete((*firstData)[i], key2)
		finalResult = append(finalResult, (*firstData)[i])
	}
	return &finalResult
}
func InnerJoin(firstData *[]map[string]interface{}, secondData *[]map[string]interface{}, key1 string, key2 string) *[]map[string]interface{} {
	var finalResult = make([]map[string]interface{}, 0)
	var mapSecond = make(map[string]*map[string]interface{})
	for i := 0; i < len(*secondData); i++ {
		mapSecond[(*secondData)[i][key2].(string)] = &(*secondData)[i]
	}
	for i := 0; i < len(*firstData); i++ {
		if item := mapSecond[(*firstData)[i][key1].(string)]; item != nil {
			for k, v := range *mapSecond[(*firstData)[i][key1].(string)] {
				(*firstData)[i][k] = v
			}
			delete((*firstData)[i], key1)
			delete((*firstData)[i], key2)
			finalResult = append(finalResult, (*firstData)[i])
		}
	}
	return &finalResult
}
