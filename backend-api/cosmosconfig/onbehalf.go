package cosmosconfig

import (
	azcosmosapi "api/azcosmos-api"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

func OnBehalfUserKey(name string) string {
	hash := sha256.Sum256([]byte(name))
	return hex.EncodeToString(hash[:])
}

func ListOnBehalfUsers() []map[string]interface{} {
	return QueryOnBehalf("SELECT c.id, c['On-Behalf'] FROM c")
}

func GetOnBehalfByID(id string) map[string]interface{} {
	id = escapeQueryValue(id)
	rows := QueryOnBehalf(fmt.Sprintf("SELECT * FROM c WHERE c.id = '%s'", id))
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}

func FindOnBehalfByName(name string) []map[string]interface{} {
	name = escapeQueryValue(name)
	return QueryOnBehalf(fmt.Sprintf("SELECT * FROM c WHERE c['On-Behalf'] = '%s'", name))
}

func FindOnBehalfByNameExcludingID(name, excludeID string) []map[string]interface{} {
	name = escapeQueryValue(name)
	excludeID = escapeQueryValue(excludeID)
	return QueryOnBehalf(fmt.Sprintf(
		"SELECT c.id FROM c WHERE c['On-Behalf'] = '%s' AND c.id != '%s'",
		name, excludeID,
	))
}

func CreateOnBehalf(name string) (map[string]interface{}, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("name is required")
	}

	if len(FindOnBehalfByName(name)) > 0 {
		return nil, fmt.Errorf("on-behalf user already exists")
	}

	id := OnBehalfUserKey(name)
	if GetOnBehalfByID(id) != nil {
		return nil, fmt.Errorf("on-behalf user already exists")
	}

	item := map[string]interface{}{
		"id":        id,
		"pk":        1,
		"On-Behalf": name,
	}
	if err := azcosmosapi.CreateItem(DimDatabase(), OnBehalfContainer(), item); err != nil {
		return nil, err
	}
	return item, nil
}

func UpdateOnBehalf(id, name string) (map[string]interface{}, error) {
	id = strings.TrimSpace(id)
	name = strings.TrimSpace(name)
	if id == "" {
		return nil, fmt.Errorf("id is required")
	}
	if name == "" {
		return nil, fmt.Errorf("name is required")
	}

	row := GetOnBehalfByID(id)
	if row == nil {
		return nil, fmt.Errorf("on-behalf user not found")
	}

	conflicts := FindOnBehalfByNameExcludingID(name, id)
	if len(conflicts) > 0 {
		return nil, fmt.Errorf("on-behalf user already exists")
	}

	row["On-Behalf"] = name
	if err := azcosmosapi.ReplaceItem(DimDatabase(), OnBehalfContainer(), row); err != nil {
		return nil, err
	}
	return row, nil
}
