package labelsync

import "testing"

func TestBuildTree3(t *testing.T) {
	rows := []labelRow3{
		{L1: "Food", L2: "Groceries", L3: "Vegetables"},
	}
	tree := buildTree3(rows)

	food := asMap(tree["Food"])
	if food == nil {
		t.Fatal("expected Food node at top level")
	}

	groceries := asMap(food["Groceries"])
	if groceries == nil {
		t.Fatal("expected Groceries node")
	}

	leaf := asMap(groceries["Vegetables"])
	if leaf == nil {
		t.Fatal("expected Vegetables leaf")
	}

	l1 := leaf["L1"].([]string)
	if len(l1) == 0 || l1[0] != "Food" {
		t.Fatalf("unexpected L1 options: %#v", l1)
	}
}

func TestBuildTree2(t *testing.T) {
	rows := []labelRow2{{L1: "Salary", L2: "Monthly"}}
	tree := buildTree2(rows)

	salary := asMap(tree["Salary"])
	if salary == nil {
		t.Fatal("expected Salary node")
	}
	leaf := asMap(salary["Monthly"])
	if leaf == nil {
		t.Fatal("expected Monthly leaf")
	}
	l2, ok := leaf["L2"].([]string)
	if !ok || len(l2) == 0 {
		t.Fatalf("unexpected L2 options: %#v", leaf["L2"])
	}
}
