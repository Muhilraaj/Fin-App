package cosmosconfig

import (
	azcosmosapi "api/azcosmos-api"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

func OnBehalfUserKey(onBehalf string) string {
	hash := sha256.Sum256([]byte(onBehalf))
	return hex.EncodeToString(hash[:])
}

func ListOnBehalfUsers() []map[string]interface{} {
	return QueryOnBehalf("SELECT c.id, c.pk, c['On-Behalf'], c.Name, c.Relationship FROM c")
}

func GetOnBehalfByID(id string) map[string]interface{} {
	id = escapeQueryValue(id)
	rows := QueryOnBehalf(fmt.Sprintf("SELECT * FROM c WHERE c.id = '%s'", id))
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}

func FindOnBehalfByLabel(onBehalf string) []map[string]interface{} {
	onBehalf = escapeQueryValue(onBehalf)
	return QueryOnBehalf(fmt.Sprintf("SELECT * FROM c WHERE c['On-Behalf'] = '%s'", onBehalf))
}

func FindOnBehalfByLabelExcludingID(onBehalf, excludeID string) []map[string]interface{} {
	onBehalf = escapeQueryValue(onBehalf)
	excludeID = escapeQueryValue(excludeID)
	return QueryOnBehalf(fmt.Sprintf(
		"SELECT c.id FROM c WHERE c['On-Behalf'] = '%s' AND c.id != '%s'",
		onBehalf, excludeID,
	))
}

func CreateOnBehalf(onBehalf, name, relationship string) (map[string]interface{}, error) {
	onBehalf = strings.TrimSpace(onBehalf)
	name = strings.TrimSpace(name)
	relationship = strings.TrimSpace(relationship)
	if onBehalf == "" || name == "" || relationship == "" {
		return nil, fmt.Errorf("On-Behalf, Name, and Relationship are required")
	}

	if len(FindOnBehalfByLabel(onBehalf)) > 0 {
		return nil, fmt.Errorf("on-behalf user already exists")
	}

	id := OnBehalfUserKey(onBehalf)
	if GetOnBehalfByID(id) != nil {
		return nil, fmt.Errorf("on-behalf user already exists")
	}

	item := map[string]interface{}{
		"id":           id,
		"pk":           1,
		"On-Behalf":    onBehalf,
		"Name":         name,
		"Relationship": relationship,
	}
	if err := azcosmosapi.CreateItem(DimDatabase(), OnBehalfContainer(), item); err != nil {
		return nil, err
	}
	return item, nil
}

func UpdateOnBehalf(id, onBehalf, name, relationship string) (map[string]interface{}, error) {
	id = strings.TrimSpace(id)
	onBehalf = strings.TrimSpace(onBehalf)
	name = strings.TrimSpace(name)
	relationship = strings.TrimSpace(relationship)
	if id == "" {
		return nil, fmt.Errorf("id is required")
	}
	if onBehalf == "" || name == "" || relationship == "" {
		return nil, fmt.Errorf("On-Behalf, Name, and Relationship are required")
	}

	row := GetOnBehalfByID(id)
	if row == nil {
		return nil, fmt.Errorf("on-behalf user not found")
	}

	conflicts := FindOnBehalfByLabelExcludingID(onBehalf, id)
	if len(conflicts) > 0 {
		return nil, fmt.Errorf("on-behalf user already exists")
	}

	row["On-Behalf"] = onBehalf
	row["Name"] = name
	row["Relationship"] = relationship
	if err := azcosmosapi.ReplaceItem(DimDatabase(), OnBehalfContainer(), row); err != nil {
		return nil, err
	}
	return row, nil
}
