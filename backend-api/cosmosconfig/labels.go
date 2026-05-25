package cosmosconfig

import (
	azcosmosapi "api/azcosmos-api"
	"fmt"
	"strings"
)

func escapeQueryValue(value string) string {
	return strings.ReplaceAll(value, "'", "''")
}

func CreateLabel(item map[string]interface{}) error {
	return azcosmosapi.CreateItem(DimDatabase(), LabelContainer(), item)
}

func CreateIncomeLabel(item map[string]interface{}) error {
	return azcosmosapi.CreateItem(DimDatabase(), IncomeLabelContainer(), item)
}

func ReplaceLabel(item map[string]interface{}) error {
	return azcosmosapi.ReplaceItem(DimDatabase(), LabelContainer(), item)
}

func ReplaceIncomeLabel(item map[string]interface{}) error {
	return azcosmosapi.ReplaceItem(DimDatabase(), IncomeLabelContainer(), item)
}

func DeleteLabel(id string) error {
	return azcosmosapi.DeleteItem(DimDatabase(), LabelContainer(), id)
}

func DeleteIncomeLabel(id string) error {
	return azcosmosapi.DeleteItem(DimDatabase(), IncomeLabelContainer(), id)
}

func ListExpenseLabels(scope string) []map[string]interface{} {
	var query string
	if scope == "construction" {
		query = "SELECT c.id, c.L1, c.L2, c.L3, c.Custom FROM c WHERE c.Custom = 'Construction'"
	} else {
		query = "SELECT c.id, c.L1, c.L2, c.L3 FROM c WHERE NOT IS_DEFINED(c.Custom)"
	}
	return QueryLabel(query)
}

func ListIncomeLabels() []map[string]interface{} {
	return QueryIncomeLabel("SELECT c.id, c.L1, c.L2 FROM c")
}

func FindExpenseLabelByPath(l1, l2, l3, custom string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	l2 = escapeQueryValue(l2)
	l3 = escapeQueryValue(l3)
	if custom != "" {
		custom = escapeQueryValue(custom)
		return QueryLabel(fmt.Sprintf(
			"SELECT c.id, c.L1, c.L2, c.L3, c.Custom FROM c WHERE c.L1 = '%s' AND c.L2 = '%s' AND c.L3 = '%s' AND c.Custom = '%s'",
			l1, l2, l3, custom,
		))
	}
	return QueryLabel(fmt.Sprintf(
		"SELECT c.id, c.L1, c.L2, c.L3 FROM c WHERE c.L1 = '%s' AND c.L2 = '%s' AND c.L3 = '%s' AND NOT IS_DEFINED(c.Custom)",
		l1, l2, l3,
	))
}

func FindIncomeLabelByPath(l1, l2 string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	l2 = escapeQueryValue(l2)
	return QueryIncomeLabel(fmt.Sprintf(
		"SELECT c.id, c.L1, c.L2 FROM c WHERE c.L1 = '%s' AND c.L2 = '%s'",
		l1, l2,
	))
}

func FindExpenseLabelByPathExcludingID(l1, l2, l3, custom, excludeID string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	l2 = escapeQueryValue(l2)
	l3 = escapeQueryValue(l3)
	excludeID = escapeQueryValue(excludeID)
	if custom != "" {
		custom = escapeQueryValue(custom)
		return QueryLabel(fmt.Sprintf(
			"SELECT c.id FROM c WHERE c.L1 = '%s' AND c.L2 = '%s' AND c.L3 = '%s' AND c.Custom = '%s' AND c.id != '%s'",
			l1, l2, l3, custom, excludeID,
		))
	}
	return QueryLabel(fmt.Sprintf(
		"SELECT c.id FROM c WHERE c.L1 = '%s' AND c.L2 = '%s' AND c.L3 = '%s' AND NOT IS_DEFINED(c.Custom) AND c.id != '%s'",
		l1, l2, l3, excludeID,
	))
}

func FindIncomeLabelByPathExcludingID(l1, l2, excludeID string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	l2 = escapeQueryValue(l2)
	excludeID = escapeQueryValue(excludeID)
	return QueryIncomeLabel(fmt.Sprintf(
		"SELECT c.id FROM c WHERE c.L1 = '%s' AND c.L2 = '%s' AND c.id != '%s'",
		l1, l2, excludeID,
	))
}

func CountExpenseByLabelKey(labelKey string) int {
	labelKey = escapeQueryValue(labelKey)
	rows := QueryExpense(fmt.Sprintf("SELECT c.id FROM c WHERE c.Label_key = '%s'", labelKey))
	return len(rows)
}

func CountIncomeByLabelKey(labelKey string) int {
	labelKey = escapeQueryValue(labelKey)
	rows := QueryIncome(fmt.Sprintf("SELECT c.id FROM c WHERE c.Label_key = '%s'", labelKey))
	return len(rows)
}

func GetLabelByID(id string) map[string]interface{} {
	id = escapeQueryValue(id)
	rows := QueryLabel(fmt.Sprintf("SELECT * FROM c WHERE c.id = '%s'", id))
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}

func GetIncomeLabelByID(id string) map[string]interface{} {
	id = escapeQueryValue(id)
	rows := QueryIncomeLabel(fmt.Sprintf("SELECT * FROM c WHERE c.id = '%s'", id))
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}
