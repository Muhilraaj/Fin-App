package azcosmosapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
)

func GetUser() {
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

	container, _ := client.NewContainer("DIM", "On-Behalf")
	pk := azcosmos.NewPartitionKeyNumber(1)

	queryPager := container.NewQueryItemsPager("SELECT c['On-Behalf'] FROM c", pk, nil)
	var result []map[string]interface{}

	fmt.Printf("queryPager: %v\n", queryPager)

	for queryPager.More() {
		queryResponse, err := queryPager.NextPage(context.Background())
		if err != nil {
			var responseErr *azcore.ResponseError
			errors.As(err, &responseErr)
			log.Fatal(err)
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
	fmt.Print(result)
}

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
