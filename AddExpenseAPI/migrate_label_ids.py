# -*- coding: utf-8 -*-
"""
One-off migration: replace legacy hash-based label ids with UUID surrogate ids.
Updates Label_key on all Expense and Income fact records.

Usage:
  python migrate_label_ids.py --dry-run
  python migrate_label_ids.py
"""

import argparse
import re
import uuid

from azure.cosmos import CosmosClient
from dotenv import load_dotenv
import os

load_dotenv()

endpoint = os.getenv("azcosmos_endpoint")
key = os.getenv("azcosmos_key")

LEGACY_HASH_RE = re.compile(r"^[a-fA-F0-9]{64}$")


def is_legacy_hash_id(label_id):
    return bool(LEGACY_HASH_RE.match(str(label_id)))


def migrate_label_container(client, dry_run):
    dim = client.get_database_client("DIM")
    fact = client.get_database_client("Fact")
    label_container = dim.get_container_client("Label")
    expense_container = fact.get_container_client("Expense")

    labels = list(label_container.read_all_items())
    migrated = 0
    skipped = 0

    for label in labels:
        old_id = label["id"]
        if not is_legacy_hash_id(old_id):
            skipped += 1
            continue

        new_id = str(uuid.uuid4())
        new_label = dict(label)
        new_label["id"] = new_id
        new_label["legacyId"] = old_id
        new_label["pk"] = label.get("pk", 1)

        facts = list(
            expense_container.query_items(
                query="SELECT * FROM c WHERE c.Label_key = @labelKey",
                parameters=[{"name": "@labelKey", "value": old_id}],
                enable_cross_partition_query=True,
            )
        )

        print(f"Label {old_id} -> {new_id} ({len(facts)} expense facts)")

        if dry_run:
            migrated += 1
            continue

        label_container.create_item(new_label)
        for fact_item in facts:
            fact_item["Label_key"] = new_id
            expense_container.replace_item(item=fact_item, body=fact_item)
        label_container.delete_item(item=old_id, partition_key=label.get("pk", 1))
        migrated += 1

    return migrated, skipped


def migrate_income_label_container(client, dry_run):
    dim = client.get_database_client("DIM")
    fact = client.get_database_client("Fact")
    label_container = dim.get_container_client("Income_Label")
    income_container = fact.get_container_client("Income")

    labels = list(label_container.read_all_items())
    migrated = 0
    skipped = 0

    for label in labels:
        old_id = label["id"]
        if not is_legacy_hash_id(old_id):
            skipped += 1
            continue

        new_id = str(uuid.uuid4())
        new_label = dict(label)
        new_label["id"] = new_id
        new_label["legacyId"] = old_id
        new_label["pk"] = label.get("pk", 1)

        facts = list(
            income_container.query_items(
                query="SELECT * FROM c WHERE c.Label_key = @labelKey",
                parameters=[{"name": "@labelKey", "value": old_id}],
                enable_cross_partition_query=True,
            )
        )

        print(f"Income label {old_id} -> {new_id} ({len(facts)} income facts)")

        if dry_run:
            migrated += 1
            continue

        label_container.create_item(new_label)
        for fact_item in facts:
            fact_item["Label_key"] = new_id
            income_container.replace_item(item=fact_item, body=fact_item)
        label_container.delete_item(item=old_id, partition_key=label.get("pk", 1))
        migrated += 1

    return migrated, skipped


def main():
    parser = argparse.ArgumentParser(description="Migrate label ids from hash to UUID")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing")
    args = parser.parse_args()

    client = CosmosClient(url=endpoint, credential=key)

    print("=== Expense/Construction labels (Label container) ===")
    exp_migrated, exp_skipped = migrate_label_container(client, args.dry_run)
    print(f"Migrated: {exp_migrated}, Skipped (already UUID): {exp_skipped}")

    print("\n=== Income labels (Income_Label container) ===")
    inc_migrated, inc_skipped = migrate_income_label_container(client, args.dry_run)
    print(f"Migrated: {inc_migrated}, Skipped (already UUID): {inc_skipped}")

    if args.dry_run:
        print("\nDry run complete. Re-run without --dry-run to apply.")
    else:
        print("\nMigration complete. Run prepareExpense.py, prepareConstruction.py, prepareIncome.py to rebuild blobs.")


if __name__ == "__main__":
    main()
