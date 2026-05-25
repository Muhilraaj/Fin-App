package azcosmosapi

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
)

func CreateItem(databaseid string, containerid string, item map[string]interface{}) error {
	endpoint := os.Getenv("Cosmos_DB_Endpoint")
	key := os.Getenv("Cosmos_DB_Key")

	cred, err := azcosmos.NewKeyCredential(key)
	if err != nil {
		log.Fatal("Failed to create a credential: ", err)
	}

	client, err := azcosmos.NewClientWithKey(endpoint, cred, nil)
	if err != nil {
		log.Fatal("Failed to create Azure Cosmos DB client: ", err)
	}

	container, err := client.NewContainer(databaseid, containerid)
	if err != nil {
		return err
	}

	marshalled, err := json.Marshal(item)
	if err != nil {
		return err
	}

	pk := azcosmos.NewPartitionKeyNumber(1)
	_, err = container.CreateItem(context.Background(), pk, marshalled, nil)
	return err
}
