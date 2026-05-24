package cosmosconfig

import (
	"os"
	"testing"
)

func TestTableDefaults(t *testing.T) {
	os.Unsetenv("Cosmos_DB_Expense_Container")

	if got := ExpenseContainer(); got != "Expense_Test" {
		t.Fatalf("ExpenseContainer() = %q, want Expense_Test", got)
	}
	if got := DimDatabase(); got != "DIM" {
		t.Fatalf("DimDatabase() = %q, want DIM", got)
	}
	if got := LoginContainer(); got != "Login_Dev" {
		t.Fatalf("LoginContainer() = %q, want Login_Dev", got)
	}
}

func TestTableEnvOverride(t *testing.T) {
	t.Setenv("Cosmos_DB_Expense_Container", "Expense_Prod")
	if got := ExpenseContainer(); got != "Expense_Prod" {
		t.Fatalf("ExpenseContainer() = %q, want Expense_Prod", got)
	}
}
