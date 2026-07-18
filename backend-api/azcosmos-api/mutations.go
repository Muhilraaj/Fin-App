package azcosmosapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
)

const maxTransactionalBatchSize = 100

var ErrTransactionalBatchTooLarge = errors.New("transactional batch exceeds Cosmos DB limit of 100 operations")

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

// ReplaceItemsBatch atomically replaces multiple items in the same partition (pk=1).
func ReplaceItemsBatch(databaseid, containerid string, items []map[string]interface{}) error {
	if len(items) == 0 {
		return nil
	}
	if len(items) > maxTransactionalBatchSize {
		return fmt.Errorf("%w: got %d items", ErrTransactionalBatchTooLarge, len(items))
	}

	container, err := cosmosContainer(databaseid, containerid)
	if err != nil {
		return err
	}

	batch := container.NewTransactionalBatch(partitionKey())
	for _, item := range items {
		id, ok := item["id"].(string)
		if !ok {
			return errors.New("ReplaceItemsBatch: missing string id")
		}
		marshalled, err := json.Marshal(item)
		if err != nil {
			return err
		}
		batch.ReplaceItem(id, marshalled, nil)
	}

	resp, err := container.ExecuteTransactionalBatch(context.Background(), batch, nil)
	if err != nil {
		return err
	}
	if resp.Success {
		return nil
	}

	for i, op := range resp.OperationResults {
		if op.StatusCode >= 400 && op.StatusCode != 424 {
			return fmt.Errorf("transactional batch failed at operation %d: status %d", i, op.StatusCode)
		}
	}
	return errors.New("transactional batch failed")
}
