package main

import (
	"api/auth"
	azcosmosapi "api/azcosmos-api"
	"api/cosmosconfig"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

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
	cookie, err := c.Cookie("token")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	var result = cosmosconfig.QueryOnBehalf("SELECT c['On-Behalf'],c['id'] as userKey FROM c")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	c.JSON(http.StatusAccepted, &result)
}

func getLabel(c *gin.Context) {
	cookie, err := c.Cookie("token")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	cred, _ := azblob.NewSharedKeyCredential(os.Getenv("Storage_Account_Name"), os.Getenv("Storage_Account_Key"))
	options := azblob.PipelineOptions{}
	var blob_url = map[string]string{"/expense": os.Getenv("EXPENSE_BLOB_URL"), "/income": os.Getenv("INCOME_BLOB_URL"), "/construction": os.Getenv("CONSTRUCTION_BLOB_URL")}
	u, _ := url.Parse(blob_url[c.Param("path")])
	pipeline := azblob.NewPipeline(cred, options)
	url := azblob.NewBlobURL(*u, pipeline)
	ctx := context.Background()
	b, _ := url.Download(ctx, 0, azblob.CountToEnd, azblob.BlobAccessConditions{}, false, azblob.ClientProvidedKeyOptions{})
	var label = make(map[string]interface{})
	_ = json.NewDecoder(b.Body(azblob.RetryReaderOptions{})).Decode(&label)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	c.JSON(http.StatusAccepted, &label)
}

func APIPort() string {
	port := "8080"
	if val, ok := os.LookupEnv("FUNCTIONS_CUSTOMHANDLER_PORT"); ok {
		port = val
	}
	return "0.0.0.0:" + port
}

func postExpense(c *gin.Context) {
	cookie, err := c.Cookie("token")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	var expense = make(map[string]interface{})
	if err := c.ShouldBindJSON(&expense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "send proper expense data"})
		return
	}
	var result = make(map[string]interface{})
	if ecust := expense["Custom"]; ecust != nil {
		result["Custom"] = expense["Custom"]
		result["Label_key"] = customHash(fmt.Sprintf("%v%v%v%v", expense["L1"], expense["L2"], expense["L3"], expense["Custom"]))
	} else {
		result["Label_key"] = customHash(fmt.Sprintf("%v%v%v", expense["L1"], expense["L2"], expense["L3"]))
	}
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
	result["User_key"] = customHash(fmt.Sprint(expense["Onbehalf"]))
	result["id"] = customHash(fmt.Sprintf("%v%v%v", expense["Timestamp"], expense["Label_key"], expense["User_key"]))
	result["pk"] = 1

	err = cosmosconfig.CreateExpense(result)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "POST")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	if err != nil {
		fmt.Print(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "send proper expense data"})
		return
	}
}

func postIncome(c *gin.Context) {
	cookie, err := c.Cookie("token")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	var income = make(map[string]interface{})
	if err := c.ShouldBindJSON(&income); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "send proper income data"})
		return
	}
	var result = make(map[string]interface{})
	result["Income"] = income["Income"]
	result["Income_Note"] = income["Income_Note"]
	input_format := "01/02/2006 15:04:05"
	output_format := "2006-01-02 15:04:05"
	parsedTime, err := time.Parse(input_format, fmt.Sprint(income["Timestamp"]))
	if err != nil {
		fmt.Print(err)
		panic(err)
	}
	result["Timestamp"] = parsedTime.Format(output_format)
	result["Label_key"] = customHash(fmt.Sprintf("%v%v", income["L1"], income["L2"]))
	result["id"] = customHash(fmt.Sprintf("%v%v", income["Timestamp"], income["Label_key"]))
	result["pk"] = 1

	err = cosmosconfig.CreateIncome(result)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "POST")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	if err != nil {
		fmt.Print(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "send proper income data"})
		return
	}
}

func postJWT(c *gin.Context) {
	//fmt.Println(c.Request.Header.Get("Origin"))
	var login = make(map[string]interface{})
	if err := c.ShouldBindJSON(&login); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "send login credentials"})
		return
	}
	query := fmt.Sprintf("select c['name'],c['user-id'],c['mail-id'] from c where c['user-id']='%s' and c['password']='%s'", login["user-id"], login["password"])
	data := cosmosconfig.QueryLogin(query)
	//origin := c.Request.Header.Get("Origin")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "POST")
	c.Header("Access-Control-Allow-Headers", "Content-Type,*")
	c.Header("Access-Control-Allow-Credentials", "true")
	c.Header("Access-Control-Expose-Headers", "*, Authorization")
	//origin, _ := url.Parse(c.Request.Header.Get("Origin"))
	istLocation, _ := time.LoadLocation("Asia/Kolkata")
	currentTime := time.Now().In(istLocation)

	if len(data) == 1 {
		data[0]["datetime"] = currentTime.Add(30 * time.Minute)
		token := auth.GenerateToken(data[0])
		cookie := http.Cookie{
			Name:  "token",
			Value: token,
			//Domain:   origin.Hostname(),
			HttpOnly: true,
			Secure:   true,
			Path:     "/",
			SameSite: http.SameSiteNoneMode,
		}
		cookie.Expires = currentTime.Add(30 * time.Minute)
		http.SetCookie(c.Writer, &cookie)
		c.JSON(http.StatusOK, gin.H{"message": "Login successful", "expiryMinutes": 30})
		return
	}
	c.JSON(http.StatusForbidden, gin.H{"error": "incorrect login credentials"})
}

func checkToken(c *gin.Context) {
	cookie, err := c.Cookie("token")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cookie Present"})
}

func getExpense(c *gin.Context) {
	cookie, err := c.Cookie("token")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	var filters = c.Request.URL.Query()
	var expenseQuery = "SELECT c['Expense'],c['Expense_Note'],c['Label_key'],c['User_key'],c['Timestamp'] FROM c"
	if v := filters["custom"]; v != nil {
		expenseQuery = fmt.Sprintf("%s WHERE c.Custom = '%s'", expenseQuery, v[0])
	} else {
		expenseQuery = fmt.Sprintf("%s WHERE NOT IS_DEFINED(c['Custom'])", expenseQuery)
	}
	var labelQuery = "SELECT c['id'],c['L1'],c['L2'],c['L3'] FROM c"
	var flagExpenseQuery = false
	//add filter to the query
	if v := filters["monthYear"]; v != nil {
		year := v[0][0:4]
		month := v[0][4:6]
		expenseQuery = fmt.Sprintf("%s and c.Timestamp >= '%s-%s-01' and c.Timestamp<='%s-%s-31 23:59:59'", expenseQuery, year, month, year, month)
		flagExpenseQuery = true
	}
	if v := filters["L3"]; v != nil {
		labelQuery = fmt.Sprintf("%s WHERE c.L3 = '%s'", labelQuery, v[0])
	} else if v := filters["L2"]; v != nil {
		labelQuery = fmt.Sprintf("%s WHERE c.L2 = '%s'", labelQuery, v[0])
	} else if v := filters["L1"]; v != nil {
		labelQuery = fmt.Sprintf("%s WHERE c.L1 = '%s'", labelQuery, v[0])
	}
	if v := filters["userKey"]; v != nil {
		if !flagExpenseQuery {
			expenseQuery = fmt.Sprintf("%s and c.User_key = '%s'", expenseQuery, v[0])
		} else {
			expenseQuery = fmt.Sprintf("%s and c.User_key = '%s'", expenseQuery, v[0])
		}
	}
	expenseQuery = fmt.Sprintf("%s order by c.Timestamp", expenseQuery)
	expense := cosmosconfig.QueryExpense(expenseQuery)
	label := cosmosconfig.QueryLabel(labelQuery)
	on_behalf := cosmosconfig.QueryOnBehalf("SELECT c['id'],c['On-Behalf'] FROM c")
	finalData := azcosmosapi.InnerJoin(azcosmosapi.InnerJoin(&expense, &label, "Label_key", "id"), &on_behalf, "User_key", "id")
	//calculate total income
	var totalExpense = 0
	for i := range *finalData {
		if v, ok := ((*finalData)[i]["Expense"]).(int); ok {
			totalExpense += v
		} else if v, ok := ((*finalData)[i]["Expense"]).(string); ok {
			i, _ = strconv.Atoi(v)
			totalExpense += i
		} else if v, ok := ((*finalData)[i]["Expense"]).(float64); ok {
			totalExpense += int(v)
		}
	}
	var result = map[string]interface{}{"data": finalData, "totalExpense": totalExpense}
	c.JSON(http.StatusAccepted, &result)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
}

func getIncome(c *gin.Context) {
	cookie, err := c.Cookie("token")
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	_, err = auth.ValidateToken(cookie)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusUnauthorized, make(map[string]interface{}))
		return
	}
	var filters = c.Request.URL.Query()
	var incomeQuery = "SELECT c['Income'],c['Income_Note'],c['Label_key'],c['Timestamp'] FROM c "
	var labelQuery = "SELECT c['id'],c['L1'],c['L2'],c['L3'] FROM c"
	//add filter to the query
	if v := filters["monthYear"]; v != nil {
		year := v[0][0:4]
		month := v[0][4:6]
		incomeQuery = fmt.Sprintf("%s Where c.Timestamp >= '%s-%s-01' and c.Timestamp<='%s-%s-31'", incomeQuery, year, month, year, month)
	}
	if v := filters["L2"]; v != nil {
		labelQuery = fmt.Sprintf("%s Where c.L2 = '%s'", labelQuery, v[0])
	} else if v := filters["L1"]; v != nil {
		labelQuery = fmt.Sprintf("%s Where c.L1 = '%s'", labelQuery, v[0])
	}
	incomeQuery = fmt.Sprintf("%s order by c.Timestamp", incomeQuery)
	income := cosmosconfig.QueryIncome(incomeQuery)
	label := cosmosconfig.QueryIncomeLabel(labelQuery)
	finalData := azcosmosapi.InnerJoin(&income, &label, "Label_key", "id")
	//calculate total income
	var totalIncome = 0
	for i := range *finalData {
		if v, ok := ((*finalData)[i]["Income"]).(int); ok {
			totalIncome += v
		} else if v, ok := ((*finalData)[i]["Income"]).(string); ok {
			i, _ = strconv.Atoi(v)
			totalIncome += i
		} else if v, ok := ((*finalData)[i]["Income"]).(float64); ok {
			totalIncome += int(v)
		}
	}
	var result = map[string]interface{}{"data": finalData, "totalIncome": totalIncome}
	c.JSON(http.StatusAccepted, &result)
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET")
	c.Header("Access-Control-Allow-Headers", "Content-Type")
}

func main() {
	route := gin.Default()
	route.Use(func(c *gin.Context) {
		// Check if the request method is OPTIONS
		if c.Request.Method == http.MethodOptions {
			// Set the necessary headers for CORS (Cross-Origin Resource Sharing)
			//origin := c.Request.Header.Get("Origin")
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type,*")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Expose-Headers", "*, Authorization")
			c.AbortWithStatus(http.StatusOK)
		} else {
			// Continue processing other requests
			c.Next()
		}
	})
	route.GET("api/user", getUser)
	route.GET("api/checkCookie", checkToken)
	route.GET("api/labels/*path", getLabel)
	route.POST("api/expense", postExpense)
	route.GET("api/expense", getExpense)
	route.GET("api/income", getIncome)
	route.POST("api/income", postIncome)
	route.POST("api/login", postJWT)
	port_info := APIPort()
	fmt.Println("Starting custom handler on", port_info)
	route.Run(port_info)
	log.Println("API is up & running - ")
}
