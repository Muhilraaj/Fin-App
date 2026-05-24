package cosmosconfig

import azcosmosapi "api/azcosmos-api"

const partitionKey = 1

func query(database, container, queryString string) []map[string]interface{} {
	return azcosmosapi.ExecuteQuery(database, container, queryString, partitionKey)
}

func QueryOnBehalf(queryString string) []map[string]interface{} {
	return query(DimDatabase(), OnBehalfContainer(), queryString)
}

func QueryLogin(queryString string) []map[string]interface{} {
	return query(DimDatabase(), LoginContainer(), queryString)
}

func QueryExpense(queryString string) []map[string]interface{} {
	return query(FactDatabase(), ExpenseContainer(), queryString)
}

func QueryLabel(queryString string) []map[string]interface{} {
	return query(DimDatabase(), LabelContainer(), queryString)
}

func QueryIncome(queryString string) []map[string]interface{} {
	return query(FactDatabase(), IncomeContainer(), queryString)
}

func QueryIncomeLabel(queryString string) []map[string]interface{} {
	return query(DimDatabase(), IncomeLabelContainer(), queryString)
}

func CreateExpense(item map[string]interface{}) error {
	return azcosmosapi.CreateItem(FactDatabase(), ExpenseContainer(), item)
}

func CreateIncome(item map[string]interface{}) error {
	return azcosmosapi.CreateItem(FactDatabase(), IncomeContainer(), item)
}
