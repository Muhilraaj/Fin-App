package azcosmosapi

import (
	"context"
	"encoding/json"
	"errors"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
)

func cosmosContainer(databaseid, containerid string) (*azcosmos.ContainerClient, error) {
	endpoint := os.Getenv("Cosmos_DB_Endpoint")
	key := os.Getenv("Cosmos_DB_Key")

	cred, err := azcosmos.NewKeyCredential(key)
	if err != nil {
		return nil, err
	}

	client, err := azcosmos.NewClientWithKey(endpoint, cred, nil)
	if err != nil {
		return nil, err
	}

	return client.NewContainer(databaseid, containerid)
}

func partitionKey() azcosmos.PartitionKey {
	return azcosmos.NewPartitionKeyNumber(1)
}

func DeleteItem(databaseid, containerid, id string) error {
	container, err := cosmosContainer(databaseid, containerid)
	if err != nil {
		return err
	}

	_, err = container.DeleteItem(context.Background(), partitionKey(), id, nil)
	return err
}

func ReplaceItem(databaseid, containerid string, item map[string]interface{}) error {
	container, err := cosmosContainer(databaseid, containerid)
	if err != nil {
		return err
	}

	id, ok := item["id"].(string)
	if !ok {
		return errors.New("ReplaceItem: missing string id")
	}

	marshalled, err := json.Marshal(item)
	if err != nil {
		return err
	}

	_, err = container.ReplaceItem(context.Background(), partitionKey(), id, marshalled, nil)
	return err
}
