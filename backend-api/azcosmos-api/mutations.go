package azcosmosapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
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
	return deleteItem(context.Background(), databaseid, containerid, id, nil)
}

func DeleteItemIfMatch(ctx context.Context, databaseid, containerid, id string, version azcore.ETag) error {
	return deleteItem(ctx, databaseid, containerid, id, &azcosmos.ItemOptions{IfMatchEtag: &version})
}

func deleteItem(ctx context.Context, databaseid, containerid, id string, options *azcosmos.ItemOptions) error {
	container, err := cosmosContainer(databaseid, containerid)
	if err != nil {
		return err
	}

	_, err = container.DeleteItem(ctx, partitionKey(), id, options)
	return err
}

func ReplaceItem(databaseid, containerid string, item map[string]interface{}) error {
	return replaceItem(context.Background(), databaseid, containerid, item, nil)
}

func ReplaceItemIfMatch(ctx context.Context, databaseid, containerid string, item map[string]interface{}, version azcore.ETag) error {
	return replaceItem(ctx, databaseid, containerid, item, &azcosmos.ItemOptions{IfMatchEtag: &version})
}

// MoveItemIfMatch changes the document ID without releasing its old ID on failure.
func MoveItemIfMatch(ctx context.Context, databaseid, containerid, oldID string, item map[string]interface{}, version azcore.ETag) error {
	container, err := cosmosContainer(databaseid, containerid)
	if err != nil {
		return err
	}
	marshalled, err := json.Marshal(item)
	if err != nil {
		return err
	}
	batch := container.NewTransactionalBatch(partitionKey())
	batch.DeleteItem(oldID, &azcosmos.TransactionalBatchItemOptions{IfMatchETag: &version})
	batch.CreateItem(marshalled, nil)
	return executeBatch(ctx, container, batch)
}

func replaceItem(ctx context.Context, databaseid, containerid string, item map[string]interface{}, options *azcosmos.ItemOptions) error {
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

	_, err = container.ReplaceItem(ctx, partitionKey(), id, marshalled, options)
	return err
}

func ReadItem(ctx context.Context, databaseid, containerid, id string) (map[string]interface{}, azcore.ETag, error) {
	container, err := cosmosContainer(databaseid, containerid)
	if err != nil {
		return nil, "", err
	}
	response, err := container.ReadItem(ctx, partitionKey(), id, nil)
	if err != nil {
		return nil, "", err
	}
	decoder := json.NewDecoder(bytes.NewReader(response.Value))
	decoder.UseNumber()
	var item map[string]interface{}
	if err := decoder.Decode(&item); err != nil {
		return nil, "", err
	}
	return item, response.ETag, nil
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

	return executeBatch(context.Background(), container, batch)
}

func executeBatch(ctx context.Context, container *azcosmos.ContainerClient, batch azcosmos.TransactionalBatch) error {
	resp, err := container.ExecuteTransactionalBatch(ctx, batch, nil)
	if err != nil {
		return err
	}
	if resp.Success {
		return nil
	}

	for i, op := range resp.OperationResults {
		if op.StatusCode >= 400 && op.StatusCode != http.StatusFailedDependency {
			return fmt.Errorf("transactional batch failed at operation %d: %w", i, &azcore.ResponseError{StatusCode: int(op.StatusCode)})
		}
	}
	return errors.New("transactional batch failed")
}
