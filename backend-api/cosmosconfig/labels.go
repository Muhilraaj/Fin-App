package cosmosconfig

import (
	azcosmosapi "api/azcosmos-api"
	"fmt"
	"strings"
)

const activeFilterClause = "(NOT IS_DEFINED(c.Active) OR c.Active = 'Y')"

func IsLabelActive(item map[string]interface{}) bool {
	if item == nil {
		return false
	}
	val, ok := item["Active"]
	if !ok || val == nil {
		return true
	}
	s := strings.TrimSpace(fmt.Sprint(val))
	if s == "" {
		return true
	}
	return strings.ToUpper(s) == "Y"
}

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

func ReplaceLabelsBatch(items []map[string]interface{}) error {
	return azcosmosapi.ReplaceItemsBatch(DimDatabase(), LabelContainer(), items)
}

func ReplaceIncomeLabelsBatch(items []map[string]interface{}) error {
	return azcosmosapi.ReplaceItemsBatch(DimDatabase(), IncomeLabelContainer(), items)
}

func DeleteLabel(id string) error {
	return azcosmosapi.DeleteItem(DimDatabase(), LabelContainer(), id)
}

func DeleteIncomeLabel(id string) error {
	return azcosmosapi.DeleteItem(DimDatabase(), IncomeLabelContainer(), id)
}

func ListExpenseLabels(scope string) []map[string]interface{} {
	return listExpenseLabels(scope, false)
}

func ListActiveExpenseLabels(scope string) []map[string]interface{} {
	return listExpenseLabels(scope, true)
}

func listExpenseLabels(scope string, activeOnly bool) []map[string]interface{} {
	activeClause := ""
	if activeOnly {
		activeClause = " AND " + activeFilterClause
	}
	var query string
	if scope == "construction" {
		query = fmt.Sprintf(
			"SELECT c.id, c.L1, c.L2, c.L3, c.Custom, c.Active FROM c WHERE c.Custom = 'Construction'%s",
			activeClause,
		)
	} else {
		query = fmt.Sprintf(
			"SELECT c.id, c.L1, c.L2, c.L3, c.Active FROM c WHERE NOT IS_DEFINED(c.Custom)%s",
			activeClause,
		)
	}
	return QueryLabel(query)
}

func ListIncomeLabels() []map[string]interface{} {
	return listIncomeLabels(false)
}

func ListActiveIncomeLabels() []map[string]interface{} {
	return listIncomeLabels(true)
}

func listIncomeLabels(activeOnly bool) []map[string]interface{} {
	query := "SELECT c.id, c.L1, c.L2, c.Active FROM c"
	if activeOnly {
		query += " WHERE " + activeFilterClause
	}
	return QueryIncomeLabel(query)
}

func expenseScopeClause(scope string) string {
	if scope == "construction" {
		return "c.Custom = 'Construction'"
	}
	return "NOT IS_DEFINED(c.Custom)"
}

func FindExpenseLabelsByL1(l1, scope string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	return QueryLabel(fmt.Sprintf(
		"SELECT * FROM c WHERE c.L1 = '%s' AND %s",
		l1, expenseScopeClause(scope),
	))
}

func FindExpenseLabelsByL1L2(l1, l2, scope string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	l2 = escapeQueryValue(l2)
	return QueryLabel(fmt.Sprintf(
		"SELECT * FROM c WHERE c.L1 = '%s' AND c.L2 = '%s' AND %s",
		l1, l2, expenseScopeClause(scope),
	))
}

func FindIncomeLabelsByL1(l1 string) []map[string]interface{} {
	l1 = escapeQueryValue(l1)
	return QueryIncomeLabel(fmt.Sprintf("SELECT * FROM c WHERE c.L1 = '%s'", l1))
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

func RenameExpenseLabels(scope, level, id string, from, to map[string]string) ([]map[string]interface{}, error) {
	var rows []map[string]interface{}
	switch level {
	case "L1":
		rows = FindExpenseLabelsByL1(from["L1"], scope)
	case "L2":
		rows = FindExpenseLabelsByL1L2(from["L1"], from["L2"], scope)
	case "L3":
		row := GetLabelByID(id)
		if row == nil {
			return nil, fmt.Errorf("label not found")
		}
		rows = []map[string]interface{}{row}
	default:
		return nil, fmt.Errorf("invalid level")
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("no labels matched")
	}

	custom := ""
	if scope == "construction" {
		custom = "Construction"
	}

	batchIDs := make(map[string]bool, len(rows))
	for _, r := range rows {
		batchIDs[fmt.Sprint(r["id"])] = true
	}

	updates := make([]map[string]interface{}, 0, len(rows))
	for _, row := range rows {
		newL1 := fmt.Sprint(row["L1"])
		newL2 := fmt.Sprint(row["L2"])
		newL3 := fmt.Sprint(row["L3"])
		rowID := fmt.Sprint(row["id"])

		switch level {
		case "L1":
			newL1 = to["L1"]
		case "L2":
			newL2 = to["L2"]
		case "L3":
			newL3 = to["L3"]
		}

		if newL1 == "" || newL2 == "" || newL3 == "" {
			return nil, fmt.Errorf("L1, L2, and L3 are required")
		}

		conflicts := FindExpenseLabelByPathExcludingID(newL1, newL2, newL3, custom, rowID)
		for _, conflict := range conflicts {
			if !batchIDs[fmt.Sprint(conflict["id"])] {
				return nil, fmt.Errorf("label path already exists")
			}
		}

		updated := make(map[string]interface{}, len(row))
		for k, v := range row {
			updated[k] = v
		}
		updated["L1"] = newL1
		updated["L2"] = newL2
		updated["L3"] = newL3
		updates = append(updates, updated)
	}

	if err := ReplaceLabelsBatch(updates); err != nil {
		return nil, err
	}
	return updates, nil
}

func RenameIncomeLabels(level, id string, from, to map[string]string) ([]map[string]interface{}, error) {
	var rows []map[string]interface{}
	switch level {
	case "L1":
		rows = FindIncomeLabelsByL1(from["L1"])
	case "L2":
		row := GetIncomeLabelByID(id)
		if row == nil {
			return nil, fmt.Errorf("label not found")
		}
		rows = []map[string]interface{}{row}
	default:
		return nil, fmt.Errorf("invalid level")
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("no labels matched")
	}

	batchIDs := make(map[string]bool, len(rows))
	for _, r := range rows {
		batchIDs[fmt.Sprint(r["id"])] = true
	}

	updates := make([]map[string]interface{}, 0, len(rows))
	for _, row := range rows {
		newL1 := fmt.Sprint(row["L1"])
		newL2 := fmt.Sprint(row["L2"])
		rowID := fmt.Sprint(row["id"])

		switch level {
		case "L1":
			newL1 = to["L1"]
		case "L2":
			newL2 = to["L2"]
		}

		if newL1 == "" || newL2 == "" {
			return nil, fmt.Errorf("L1 and L2 are required")
		}

		conflicts := FindIncomeLabelByPathExcludingID(newL1, newL2, rowID)
		for _, conflict := range conflicts {
			if !batchIDs[fmt.Sprint(conflict["id"])] {
				return nil, fmt.Errorf("label path already exists")
			}
		}

		updated := make(map[string]interface{}, len(row))
		for k, v := range row {
			updated[k] = v
		}
		updated["L1"] = newL1
		updated["L2"] = newL2
		updates = append(updates, updated)
	}

	if err := ReplaceIncomeLabelsBatch(updates); err != nil {
		return nil, err
	}
	return updates, nil
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

func SetExpenseLabelActive(id, active string) (map[string]interface{}, error) {
	row := GetLabelByID(id)
	if row == nil {
		return nil, fmt.Errorf("label not found")
	}
	row["Active"] = active
	if err := ReplaceLabel(row); err != nil {
		return nil, err
	}
	return row, nil
}

func SetIncomeLabelActive(id, active string) (map[string]interface{}, error) {
	row := GetIncomeLabelByID(id)
	if row == nil {
		return nil, fmt.Errorf("label not found")
	}
	row["Active"] = active
	if err := ReplaceIncomeLabel(row); err != nil {
		return nil, err
	}
	return row, nil
}
