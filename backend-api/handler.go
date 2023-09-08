package main

import (
	"api/auth"
	azcosmosapi "api/azcosmos-api"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
	"github.com/Azure/azure-storage-blob-go/azblob"
	"github.com/gin-gonic/gin"
)

func customHash(data interface{}) string {
	strData := fmt.Sprintf("%v", data)
	hash := sha256.New()
	hash.Write([]byte(strData))
	hashBytes := hash.Sum(nil)
	hashString := hex.EncodeToString(hashBytes)
	return hashString
}

func getUser(c *gin.Context) {
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

	for queryPager.More() {
		queryResponse, err := queryPager.NextPage(context.Background())
		if err != nil {
			var responseErr *azcore.ResponseError
			errors.As(err, &responseErr)
			panic(responseErr)
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
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	c.JSON(http.StatusAccepted, &result)
}

func getLabel(c *gin.Context) {
	cred, _ := azblob.NewSharedKeyCredential(os.Getenv("Storage_Account_Name"), os.Getenv("Storage_Account_Key"))
	options := azblob.PipelineOptions{}
	u, _ := url.Parse(os.Getenv("BLOB_URL"))
	pipeline := azblob.NewPipeline(cred, options)
	url := azblob.NewBlobURL(*u, pipeline)
	ctx := context.Background()
	b, _ := url.Download(ctx, 0, azblob.CountToEnd, azblob.BlobAccessConditions{}, false, azblob.ClientProvidedKeyOptions{})
	var label = make(map[string]interface{})
	_ = json.NewDecoder(b.Body(azblob.RetryReaderOptions{})).Decode(&label)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	c.JSON(http.StatusAccepted, &label)
}

func APIPort() string {
	port := ":8080"
	if val, ok := os.LookupEnv("FUNCTIONS_CUSTOMHANDLER_PORT"); ok {
		port = ":" + val
	}
	return port
}

func postExpense(c *gin.Context) {
	var expense = make(map[string]interface{})
	if err := c.ShouldBindJSON(&expense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "send proper expense data"})
		return
	}
	var result = make(map[string]interface{})
	result["Expense"] = expense["Expense"]
	result["Expense_Note"] = expense["Expense_Note"]
	input_format := "01/02/2006 15:04:05"
	output_format := "2006-01-02 15:04:05"
	parsedTime, err := time.Parse(input_format, fmt.Sprint(expense["Timestamp"]))
	if err != nil {
		fmt.Print(err)
		panic(err)
	}
	result["Timestamp"] = parsedTime.Format(output_format)
	result["Label_key"] = customHash(fmt.Sprintf("%v%v%v", expense["L1"], expense["L2"], expense["L3"]))
	result["User_key"] = customHash(fmt.Sprint(expense["Onbehalf"]))
	result["id"] = customHash(fmt.Sprintf("%v%v%v", expense["Timestamp"], expense["Label_key"], expense["User_key"]))
	result["pk"] = 1
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

	container, _ := client.NewContainer("Fact", "Expense")

	marshalled, _ := json.Marshal(result)

	pk := azcosmos.NewPartitionKeyNumber(1)
	ctx := context.Background()
	_, err = container.CreateItem(ctx, pk, marshalled, nil)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	if err != nil {
		fmt.Print(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "send proper expense data"})
		return
	}
}

func postJWT(c *gin.Context) {
	var login = make(map[string]interface{})
	if err := c.ShouldBindJSON(&login); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "send login credentials"})
		return
	}
	query := fmt.Sprintf("select c['name'],c['user-id'],c['mail-id'] from c where c['user-id']='%s' and c['password']='%s'", login["user-id"], login["password"])
	data := azcosmosapi.ExecuteQuery("DIM", "Login", query, 1)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	if len(data) == 1 {
		data[0]["datetime"] = time.Now().Add(10 * time.Minute)
		token := auth.GenerateToken(data[0])
		result := make(map[string]interface{})
		result["token"] = token
		c.JSON(http.StatusAccepted, &result)
		return
	}
	c.JSON(http.StatusForbidden, gin.H{"error": "incorrect login credentials"})
}

func main() {
	route := gin.Default()
	route.GET("api/user", getUser)
	route.GET("api/labels", getLabel)
	route.POST("api/expense", postExpense)
	route.POST("api/login", postJWT)
	port_info := APIPort()
	route.Run(port_info)
	log.Println("API is up & running - ")
}
