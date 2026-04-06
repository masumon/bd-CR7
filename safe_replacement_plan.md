# Safe Replacement Plan

## Summary

- Total direct writes: 35
- Existing APIs: NOT VERIFIED
- Missing APIs: NOT VERIFIED

---

## Module: Construction

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\EvidenceView.tsx

Operation:
delete

Table:
progress_cam

Proposed API:
DELETE /api/construction/progress_cam/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\WorkforceView.tsx

Operation:
update

Table:
worker_logs

Proposed API:
PATCH /api/construction/worker_logs/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\WorkforceView.tsx

Operation:
delete

Table:
worker_logs

Proposed API:
DELETE /api/construction/worker_logs/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\progress_cam\ProgressCamFeature.tsx

Operation:
insert

Table:
progress_cam

Proposed API:
POST /api/construction/progress_cam

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx

Operation:
update

Table:
projects

Proposed API:
PATCH /api/construction/projects/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx

Operation:
insert

Table:
projects

Proposed API:
POST /api/construction/projects

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx

Operation:
update

Table:
projects

Proposed API:
PATCH /api/construction/projects/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx

Operation:
insert

Table:
project_timeline_events

Proposed API:
POST /api/construction/project_timeline_events

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx

Operation:
insert

Table:
project_attachments

Proposed API:
POST /api/construction/project_attachments

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

## Module: Contractor

File:
D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx

Operation:
insert

Table:
contractors

Proposed API:
POST /api/contractor/contractors

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx

Operation:
insert

Table:
contractor_contracts

Proposed API:
POST /api/contractor/contractor_contracts

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx

Operation:
insert

Table:
contractor_payments

Proposed API:
POST /api/contractor/contractor_payments

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx

Operation:
delete

Table:
contractors

Proposed API:
DELETE /api/contractor/contractors/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx

Operation:
delete

Table:
contractor_contracts

Proposed API:
DELETE /api/contractor/contractor_contracts/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx

Operation:
delete

Table:
contractor_payments

Proposed API:
DELETE /api/contractor/contractor_payments/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

## Module: CRM

File:
D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx

Operation:
insert

Table:
customers

Proposed API:
POST /api/crm/customers

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx

Operation:
insert

Table:
crm_leads

Proposed API:
POST /api/crm/crm_leads

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx

Operation:
insert

Table:
crm_interactions

Proposed API:
POST /api/crm/crm_interactions

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx

Operation:
delete

Table:
customers

Proposed API:
DELETE /api/crm/customers/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx

Operation:
delete

Table:
crm_leads

Proposed API:
DELETE /api/crm/crm_leads/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx

Operation:
delete

Table:
crm_interactions

Proposed API:
DELETE /api/crm/crm_interactions/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
MEDIUM

---

## Module: Import

File:
D:\BD CR7 Project\apps\web-pwa\src\features\import_supply\ImportLCFeature.tsx

Operation:
insert

Table:
lc_records

Proposed API:
POST /api/import-supply/lc_records

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\import_supply\ImportLCFeature.tsx

Operation:
delete

Table:
lc_records

Proposed API:
DELETE /api/import-supply/lc_records/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\import_supply\ImportLCFeature.tsx

Operation:
update

Table:
lc_records

Proposed API:
PATCH /api/import-supply/lc_records/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

## Module: Inventory

File:
D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx

Operation:
insert

Table:
products

Proposed API:
POST /api/pos/products

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx

Operation:
insert

Table:
warehouses

Proposed API:
POST /api/inventory/warehouses

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx

Operation:
insert

Table:
stock_adjustments

Proposed API:
POST /api/inventory/stock_adjustments

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx

Operation:
delete

Table:
products

Proposed API:
DELETE /api/pos/products/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx

Operation:
delete

Table:
warehouses

Proposed API:
DELETE /api/inventory/warehouses/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx

Operation:
delete

Table:
stock_adjustments

Proposed API:
DELETE /api/inventory/stock_adjustments/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

## Module: Materials

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\MaterialsView.tsx

Operation:
update

Table:
material_logs

Proposed API:
PATCH /api/construction/material_logs/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
HIGH

---

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\MaterialsView.tsx

Operation:
delete

Table:
material_logs

Proposed API:
DELETE /api/construction/material_logs/{id}

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
HIGH

---

## Module: Others

File:
D:\BD CR7 Project\apps\web-pwa\src\hooks\useFinance.ts

Operation:
insert

Table:
fund_transfers

Proposed API:
POST /api/others/fund_transfers

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

File:
D:\BD CR7 Project\apps\web-pwa\src\hooks\useFinance.ts

Operation:
insert

Table:
expenses

Proposed API:
POST /api/others/expenses

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
LOW

---

## Module: Workforce

File:
D:\BD CR7 Project\apps\web-pwa\src\features\construction\worker_logs\WorkerLogsFeature.tsx

Operation:
insert

Table:
attendance

Proposed API:
POST /api/construction/attendance

Payload:
NOT VERIFIED

Backend Status:
NOT VERIFIED

Risk:
HIGH

---

## Unknown / Not Verified

- Existing/Missing API exact count requires endpoint-contract matcher refinement; marked NOT VERIFIED.
