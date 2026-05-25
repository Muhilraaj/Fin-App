package labelsync

import "fmt"

type labelRow3 struct {
	L1 string
	L2 string
	L3 string
}

type labelRow2 struct {
	L1 string
	L2 string
}

var emptyLeaf3 = func() map[string]interface{} {
	return map[string]interface{}{"L1": []string{"*"}, "L2": []string{"*"}, "L3": []string{"*"}}
}

var emptyLeaf2 = func() map[string]interface{} {
	return map[string]interface{}{"L1": []string{"*"}, "L2": []string{"*"}}
}

func buildFilterPatterns(n int, keys []string) [][]string {
	var patterns [][]string
	var rec func(i int, l []string)
	rec = func(i int, l []string) {
		if i == n {
			copyL := make([]string, n)
			copy(copyL, l)
			patterns = append(patterns, copyL)
			return
		}
		rec(i+1, l)
		x := make([]string, n)
		copy(x, l)
		x[i] = "*"
		rec(i+1, x)
	}
	rec(0, keys)
	return patterns
}

func asMap(v interface{}) map[string]interface{} {
	if m, ok := v.(map[string]interface{}); ok {
		return m
	}
	return nil
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	out := make([]string, 0, len(values))
	for _, v := range values {
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}

func ensureLeaf3(root map[string]interface{}, l1, l2, l3 string) {
	if _, ok := root["*"]; !ok {
		root["*"] = map[string]interface{}{}
	}
	l1Star := asMap(root["*"])
	if l1Star == nil {
		l1Star = map[string]interface{}{}
		root["*"] = l1Star
	}
	if _, ok := l1Star["*"]; !ok {
		l1Star["*"] = map[string]interface{}{}
	}
	l2Star := asMap(l1Star["*"])
	if l2Star == nil {
		l2Star = map[string]interface{}{}
		l1Star["*"] = l2Star
	}
	if _, ok := l2Star["*"]; !ok {
		l2Star["*"] = emptyLeaf3()
	}

	l1Node := asMap(root[l1])
	if l1Node == nil {
		root[l1] = map[string]interface{}{
			"*": map[string]interface{}{
				"*": emptyLeaf3(),
			},
			l2: map[string]interface{}{
				"*": emptyLeaf3(),
				l3: emptyLeaf3(),
			},
		}
		return
	}

	l2Node := asMap(l1Node[l2])
	if l2Node == nil {
		l1Node[l2] = map[string]interface{}{
			"*": emptyLeaf3(),
			l3: emptyLeaf3(),
		}
		return
	}

	l2Node[l3] = emptyLeaf3()
}

func ensureLeaf2(root map[string]interface{}, l1, l2 string) {
	if _, ok := root["*"]; !ok {
		root["*"] = map[string]interface{}{}
	}
	l1Star := asMap(root["*"])
	if l1Star == nil {
		l1Star = map[string]interface{}{}
		root["*"] = l1Star
	}
	if _, ok := l1Star["*"]; !ok {
		l1Star["*"] = emptyLeaf2()
	}

	l1Node := asMap(root[l1])
	if l1Node == nil {
		root[l1] = map[string]interface{}{
			"*":  emptyLeaf2(),
			l2: emptyLeaf2(),
		}
		return
	}

	l1Node[l2] = emptyLeaf2()
}

func filterRows3(rows []labelRow3, pattern, keys []string, pivot labelRow3) []labelRow3 {
	out := make([]labelRow3, 0)
	pivotValues := []string{pivot.L1, pivot.L2, pivot.L3}
	for _, row := range rows {
		match := true
		rowValues := []string{row.L1, row.L2, row.L3}
		for i, p := range pattern {
			if p == keys[i] && rowValues[i] != pivotValues[i] {
				match = false
				break
			}
		}
		if match {
			out = append(out, row)
		}
	}
	return out
}

func filterRows2(rows []labelRow2, pattern, keys []string, pivot labelRow2) []labelRow2 {
	out := make([]labelRow2, 0)
	pivotValues := []string{pivot.L1, pivot.L2}
	for _, row := range rows {
		match := true
		rowValues := []string{row.L1, row.L2}
		for i, p := range pattern {
			if p == keys[i] && rowValues[i] != pivotValues[i] {
				match = false
				break
			}
		}
		if match {
			out = append(out, row)
		}
	}
	return out
}

func setNodeValues3(root map[string]interface{}, k1, k2, k3, field string, values []string) {
	l1 := asMap(root[k1])
	if l1 == nil {
		return
	}
	l2 := asMap(l1[k2])
	if l2 == nil {
		l2 = map[string]interface{}{}
		l1[k2] = l2
	}
	node := asMap(l2[k3])
	if node == nil {
		node = map[string]interface{}{}
		l2[k3] = node
	}
	node[field] = uniqueStrings(values)
}

func setNodeValues2(root map[string]interface{}, k1, k2, field string, values []string) {
	l1 := asMap(root[k1])
	if l1 == nil {
		return
	}
	node := asMap(l1[k2])
	if node == nil {
		node = map[string]interface{}{}
		l1[k2] = node
	}
	node[field] = uniqueStrings(values)
}

func buildTree3(rows []labelRow3) map[string]interface{} {
	root := map[string]interface{}{
		"*": map[string]interface{}{
			"*": map[string]interface{}{
				"*": emptyLeaf3(),
			},
		},
	}

	for _, row := range rows {
		ensureLeaf3(root, row.L1, row.L2, row.L3)
	}

	keys := []string{"L1", "L2", "L3"}
	patterns := buildFilterPatterns(3, keys)

	for _, pattern := range patterns {
		for _, pivot := range rows {
			filtered := filterRows3(rows, pattern, keys, pivot)
			k1, k2, k3 := "*", "*", "*"
			if pattern[0] == "L1" {
				k1 = pivot.L1
			}
			if pattern[1] == "L2" {
				k2 = pivot.L2
			}
			if pattern[2] == "L3" {
				k3 = pivot.L3
			}

			for _, key := range keys {
				col := make([]string, 0, len(filtered))
				for _, row := range filtered {
					switch key {
					case "L1":
						col = append(col, row.L1)
					case "L2":
						col = append(col, row.L2)
					case "L3":
						col = append(col, row.L3)
					}
				}
				setNodeValues3(root, k1, k2, k3, key, col)
			}
		}
	}

	return root
}

func buildTree2(rows []labelRow2) map[string]interface{} {
	root := map[string]interface{}{
		"*": map[string]interface{}{
			"*": emptyLeaf2(),
		},
	}

	for _, row := range rows {
		ensureLeaf2(root, row.L1, row.L2)
	}

	keys := []string{"L1", "L2"}
	patterns := buildFilterPatterns(2, keys)

	for _, pattern := range patterns {
		for _, pivot := range rows {
			filtered := filterRows2(rows, pattern, keys, pivot)
			k1, k2 := "*", "*"
			if pattern[0] == "L1" {
				k1 = pivot.L1
			}
			if pattern[1] == "L2" {
				k2 = pivot.L2
			}

			for _, key := range keys {
				col := make([]string, 0, len(filtered))
				for _, row := range filtered {
					switch key {
					case "L1":
						col = append(col, row.L1)
					case "L2":
						col = append(col, row.L2)
					}
				}
				setNodeValues2(root, k1, k2, key, col)
			}
		}
	}

	return root
}

func rows3FromMaps(items []map[string]interface{}) []labelRow3 {
	rows := make([]labelRow3, 0, len(items))
	for _, item := range items {
		rows = append(rows, labelRow3{
			L1: fmt.Sprint(item["L1"]),
			L2: fmt.Sprint(item["L2"]),
			L3: fmt.Sprint(item["L3"]),
		})
	}
	return rows
}

func rows2FromMaps(items []map[string]interface{}) []labelRow2 {
	rows := make([]labelRow2, 0, len(items))
	for _, item := range items {
		rows = append(rows, labelRow2{
			L1: fmt.Sprint(item["L1"]),
			L2: fmt.Sprint(item["L2"]),
		})
	}
	return rows
}
