// Zod validators for offline queue and API payloads
import { z } from "zod";

export const OfflineQueueItemSchema = z.object({
  id: z.string().uuid(),
  endpoint: z.string().min(1).startsWith("/"),
  payload: z.record(z.unknown()),
  method: z.enum(["POST", "PUT", "PATCH", "DELETE"]),
  createdAt: z.number().int().positive(),
});

export const ExpenseCreateSchema = z.object({
  description: z.string().min(1).max(100),
  amount: z.number().positive(),
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
});

export const FundTransferSchema = z.object({
  from_account_id: z.string().uuid(),
  to_account_id: z.string().uuid(),
  amount: z.number().positive().max(10000000),
  reference: z.string().max(100).regex(/^[a-zA-Z0-9\-_\s]+$/, "Invalid characters in reference"),
});

export const SaleCreateSchema = z.object({
  customer_id: z.string().uuid().optional(),
  total_amount: z.number().nonnegative(),
  line_items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().positive(),
      unit_price: z.number().positive(),
    })
  ),
});

export type OfflineQueueItem = z.infer<typeof OfflineQueueItemSchema>;
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
export type FundTransfer = z.infer<typeof FundTransferSchema>;
export type SaleCreate = z.infer<typeof SaleCreateSchema>;

