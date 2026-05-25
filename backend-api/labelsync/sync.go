package labelsync

import (
	"api/cosmosconfig"
	"bytes"
	"context"
	"encoding/json"
	"net/url"
	"os"

	"github.com/Azure/azure-storage-blob-go/azblob"
)

func uploadJSON(blobURL string, tree map[string]interface{}) error {
	cred, err := azblob.NewSharedKeyCredential(os.Getenv("Storage_Account_Name"), os.Getenv("Storage_Account_Key"))
	if err != nil {
		return err
	}

	u, err := url.Parse(blobURL)
	if err != nil {
		return err
	}

	payload, err := json.Marshal(tree)
	if err != nil {
		return err
	}

	pipeline := azblob.NewPipeline(cred, azblob.PipelineOptions{})
	blockBlob := azblob.NewBlockBlobURL(*u, pipeline)
	ctx := context.Background()
	_, err = blockBlob.Upload(
		ctx,
		bytes.NewReader(payload),
		azblob.BlobHTTPHeaders{ContentType: "application/json"},
		azblob.Metadata{},
		azblob.BlobAccessConditions{},
		azblob.DefaultAccessTier,
		nil,
		azblob.ClientProvidedKeyOptions{},
		azblob.ImmutabilityPolicyOptions{},
	)
	return err
}

func RebuildExpenseBlob() error {
	rows := cosmosconfig.QueryLabel("SELECT c.L1, c.L2, c.L3 FROM c WHERE NOT IS_DEFINED(c.Custom)")
	tree := buildTree3(rows3FromMaps(rows))
	return uploadJSON(os.Getenv("EXPENSE_BLOB_URL"), tree)
}

func RebuildConstructionBlob() error {
	rows := cosmosconfig.QueryLabel("SELECT c.L1, c.L2, c.L3 FROM c WHERE c.Custom = 'Construction'")
	tree := buildTree3(rows3FromMaps(rows))
	return uploadJSON(os.Getenv("CONSTRUCTION_BLOB_URL"), tree)
}

func RebuildIncomeBlob() error {
	rows := cosmosconfig.QueryIncomeLabel("SELECT c.L1, c.L2 FROM c")
	tree := buildTree2(rows2FromMaps(rows))
	return uploadJSON(os.Getenv("INCOME_BLOB_URL"), tree)
}

func RebuildExpenseScope(scope string) error {
	if scope == "construction" {
		return RebuildConstructionBlob()
	}
	return RebuildExpenseBlob()
}
