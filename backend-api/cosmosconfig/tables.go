package cosmosconfig

import "os"

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func DimDatabase() string {
	return envOrDefault("Cosmos_DB_Dim_Database", "DIM")
}

func FactDatabase() string {
	return envOrDefault("Cosmos_DB_Fact_Database", "Fact")
}

func ExpenseContainer() string {
	return envOrDefault("Cosmos_DB_Expense_Container", "Expense_Test")
}

func IncomeContainer() string {
	return envOrDefault("Cosmos_DB_Income_Container", "Income_Test")
}

func LabelContainer() string {
	return envOrDefault("Cosmos_DB_Label_Container", "Label_Dev")
}

func IncomeLabelContainer() string {
	return envOrDefault("Cosmos_DB_Income_Label_Container", "Income_Label_Dev")
}

func OnBehalfContainer() string {
	return envOrDefault("Cosmos_DB_OnBehalf_Container", "On-Behalf_Dev")
}

func LoginContainer() string {
	return envOrDefault("Cosmos_DB_Login_Container", "Login_Dev")
}
