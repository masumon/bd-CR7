# Direct DB Usage Report

## Summary

- Total files scanned: 161
- Total files affected: 13
- Total write operations: 35
- Total read operations: 21

---

## Critical (Direct Writes)

### CRM

- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:127
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("customers").insert({
      name: name.trim(),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:177
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("crm_leads").insert({
      name: name.trim(),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:245
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("crm_interactions").insert({
      customer_id: customerId || null,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:326
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    if (type === "customer") {
      ({ error } = await supabase.from("customers").delete().eq("id", id));
    } else if (type === "lead") {
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:328
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else if (type === "lead") {
      ({ error } = await supabase.from("crm_leads").delete().eq("id", id));
    } else if (type === "interaction") {
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:330
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else if (type === "interaction") {
      ({ error } = await supabase.from("crm_interactions").delete().eq("id", id));
    }
```

### Inventory

- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:124
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      name: name.trim(),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:173
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("warehouses").insert({
      name: name.trim(),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:228
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error: adjErr } = await supabase.from("stock_adjustments").insert({
      product_id: productId,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:388
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    if (type === "product") {
      ({ error } = await supabase.from("products").delete().eq("id", id));
    } else if (type === "warehouse") {
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:390
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else if (type === "warehouse") {
      ({ error } = await supabase.from("warehouses").delete().eq("id", id));
    } else if (type === "adjustment") {
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:392
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else if (type === "adjustment") {
      ({ error } = await supabase.from("stock_adjustments").delete().eq("id", id));
    }
```

### Contractor

- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:166
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("contractors").insert({
      name: name.trim(),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:232
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error } = await supabase.from("contractor_contracts").insert({
      contractor_id: contractorId,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:306
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts

    const { error: payErr } = await supabase.from("contractor_payments").insert({
      contractor_id: contractorId,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:421
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    if (type === "contractor") {
      ({ error } = await supabase.from("contractors").delete().eq("id", id));
    } else if (type === "contract") {
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:423
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else if (type === "contract") {
      ({ error } = await supabase.from("contractor_contracts").delete().eq("id", id));
    } else if (type === "payment") {
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:425
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else if (type === "payment") {
      ({ error } = await supabase.from("contractor_payments").delete().eq("id", id));
    }
```

### Workforce

- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\worker_logs\WorkerLogsFeature.tsx:118
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    try {
      const { error } = await supabase.from("attendance").insert({
        worker_name:      workerName.trim(),
```

### Materials

- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\MaterialsView.tsx:112
  - Operation: update
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setMutationError("");
    const { error } = await supabase.from("material_logs").update({
      item_name: editForm.item_name,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\MaterialsView.tsx:130
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setMutationError("");
    const { error } = await supabase.from("material_logs").delete().eq("id", deleteTarget);
    if (error) { setMutationError(error.message); return; }
```

### Construction

- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\EvidenceView.tsx:59
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setMutationError("");
    const { error } = await supabase.from("progress_cam").delete().eq("id", deleteTarget);
    if (error) { setMutationError(error.message); return; }
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\WorkforceView.tsx:104
  - Operation: update
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setMutationError("");
    const { error } = await supabase.from("worker_logs").update({
      worker_name: editForm.worker_name,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\WorkforceView.tsx:120
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setMutationError("");
    const { error } = await supabase.from("worker_logs").delete().eq("id", deleteTarget);
    if (error) { setMutationError(error.message); return; }
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\progress_cam\ProgressCamFeature.tsx:83
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
      // Save to Supabase progress_cam table
      await supabase.from("progress_cam").insert({
        photo_url: mediaUrl,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx:246
  - Operation: update
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    if (editId) {
      const { error: e } = await supabase.from("projects").update(payload).eq("id", editId);
      err = e;
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx:249
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } else {
      const { error: e } = await supabase.from("projects").insert([payload]);
      err = e;
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx:261
  - Operation: update
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    if (!confirm("Mark this project as Cancelled?")) return;
    await supabase.from("projects").update({ status: "Cancelled" }).eq("id", id);
    fetchProjects();
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx:284
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    } catch {
      const { error } = await supabase.from("project_timeline_events").insert({
        project_id: selectedProjectId,
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\construction\projects\ProjectsFeature.tsx:332
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
      } catch {
        const { error } = await supabase.from("project_attachments").insert({
          project_id: selectedProjectId,
```

### Import

- File: D:\BD CR7 Project\apps\web-pwa\src\features\import_supply\ImportLCFeature.tsx:114
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
    setSaving(true);
    const { error: dbErr } = await supabase.from("lc_records").insert({
      supplier_name: form.supplier_name.trim(),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\import_supply\ImportLCFeature.tsx:138
  - Operation: delete
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
  const deleteRecord = async (id: string) => {
    await supabase.from("lc_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\import_supply\ImportLCFeature.tsx:153
  - Operation: update
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
  const updateStatus = async (id: string, status: LCStatus) => {
    await supabase.from("lc_records").update({ status }).eq("id", id);
    setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
```

### Others

- File: D:\BD CR7 Project\apps\web-pwa\src\hooks\useFinance.ts:35
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("fund_transfers").insert(payload);
      if (error) throw error;
```
- File: D:\BD CR7 Project\apps\web-pwa\src\hooks\useFinance.ts:51
  - Operation: insert
  - Type: DIRECT_DB_WRITE
  - Risk: HIGH
  - Snippet:
```ts
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;
```

---

## Non-Critical (Reads)

### CRM

- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:301
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
    const [custRes, leadRes, intRes] = await Promise.all([
      supabase.from("customers").select("id,name,phone,email,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }).limit(100),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:302
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("customers").select("id,name,phone,email,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("crm_interactions").select("*, customers(name), crm_leads(name)").order("interaction_date", { ascending: false }).limit(100),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\crm\CRMView.tsx:303
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("crm_interactions").select("*, customers(name), crm_leads(name)").order("interaction_date", { ascending: false }).limit(100),
    ]);
```

### Inventory

- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:365
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
    const [prodRes, whRes, adjRes] = await Promise.all([
      supabase.from("products").select("*").order("name").limit(200),
      supabase.from("warehouses").select("*").order("name").limit(100),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:366
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("products").select("*").order("name").limit(200),
      supabase.from("warehouses").select("*").order("name").limit(100),
      supabase.from("stock_adjustments").select("*, products(name, barcode), warehouses(name)").order("adjustment_date", { ascending: false }).limit(100),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\inventory\InventoryView.tsx:367
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("warehouses").select("*").order("name").limit(100),
      supabase.from("stock_adjustments").select("*, products(name, barcode), warehouses(name)").order("adjustment_date", { ascending: false }).limit(100),
    ]);
```

### Contractor

- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:382
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
    const [ctrRes, contRes, payRes] = await Promise.all([
      supabase.from("contractors").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("contractor_contracts").select("*, contractors(name)").order("created_at", { ascending: false }).limit(100),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:383
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("contractors").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("contractor_contracts").select("*, contractors(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("contractor_payments").select("*, contractors(name)").order("payment_date", { ascending: false }).limit(100),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\contractor\ContractorView.tsx:384
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("contractor_contracts").select("*, contractors(name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("contractor_payments").select("*, contractors(name)").order("payment_date", { ascending: false }).limit(100),
    ]);
```

### Reports

- File: D:\BD CR7 Project\apps\web-pwa\src\features\reports\ReportsFeature.tsx:112
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
    const [expRes, workerRes, matRes, fundRes] = await Promise.all([
      supabase.from("expenses").select("id,amount,status,created_at,metadata").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("attendance").select("worker_id,attendance_date").gte("attendance_date", sinceISO.slice(0, 10)),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\reports\ReportsFeature.tsx:113
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("expenses").select("id,amount,status,created_at,metadata").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("attendance").select("worker_id,attendance_date").gte("attendance_date", sinceISO.slice(0, 10)),
      supabase.from("material_movements").select("id,material_name,movement_type,quantity,unit_cost,created_at").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\reports\ReportsFeature.tsx:114
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("attendance").select("worker_id,attendance_date").gte("attendance_date", sinceISO.slice(0, 10)),
      supabase.from("material_movements").select("id,material_name,movement_type,quantity,unit_cost,created_at").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("fund_transactions").select("id,amount,created_at").gte("created_at", sinceISO),
```
- File: D:\BD CR7 Project\apps\web-pwa\src\features\reports\ReportsFeature.tsx:115
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
      supabase.from("material_movements").select("id,material_name,movement_type,quantity,unit_cost,created_at").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(200),
      supabase.from("fund_transactions").select("id,amount,created_at").gte("created_at", sinceISO),
    ]);
```

### Others

- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:88
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        // Projects
        supabase.from("projects").select("id,status", { count: "exact" }).limit(1000),
        // Expenses
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:90
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        // Expenses
        supabase.from("expenses").select("id,status,amount", { count: "exact" }).limit(1000),
        // Attendance today
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:92
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        // Attendance today
        supabase.from("attendance").select("id,status").eq("date", today).limit(500),
        // Materials stock
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:94
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        // Materials stock
        supabase.from("materials_stock").select("id,current_qty,low_stock_threshold").limit(500),
        // Project files
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:96
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        // Project files
        supabase.from("project_files").select("id,ai_classified").eq("status", "active").limit(2000),
        // Pending AI proposals
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:99
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        supabase.from("ai_auto_insertions")
          .select("id", { count: "exact" })
          .eq("auto_applied", false)
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:105
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        supabase.from("ai_auto_insertions")
          .select("id", { count: "exact" })
          .eq("auto_applied", true)
```
- File: D:\BD CR7 Project\apps\web-pwa\src\components\ui\ERPModuleStatusGrid.tsx:111
  - Operation: select
  - Type: READ
  - Risk: LOW
  - Snippet:
```ts
        supabase.from("expenses")
          .select("id")
          .not("metadata->proof_file_id", "is", null)
```

---

## Unknown / Not Verified

- Pattern detection method: Supabase calls where `.insert/.update/.delete/.select` appears within 8 lines after `supabase.from(...)`.
- Dynamic runtime-generated query constructions not matching this static pattern are marked as NOT VERIFIED.

