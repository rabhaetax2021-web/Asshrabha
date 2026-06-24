import { z } from 'zod'

export const createProviderProductSchema = z.object({
  catalogProductId: z.string().min(1),
  sellingPrice: z.number().positive(),
  wholesaleUnit: z.enum(['BOX', 'PACK']).optional(),
  wholesalePrice: z.number().nonnegative(),
  retailPrice: z.number().nonnegative(),
  stockQuantity: z.number().int().nonnegative().optional(),
  options: z.array(z.object({
    unitType: z.enum(['PIECE', 'BOX', 'PACK']),
    price: z.number().nonnegative(),
    stockQuantity: z.number().int().nonnegative().optional(),
    minQuantity: z.number().int().nonnegative().optional(),
    maxQuantity: z.number().int().nonnegative().optional(),
  })).optional(),
})

export const updateStoreSchema = z.object({
  providerId: z.string().min(1),
  shopNameEN: z.string().min(1).optional(),
  shopNameAR: z.string().min(1).optional(),
  descriptionEN: z.string().optional(),
  descriptionAR: z.string().optional(),
  defaultWholesaleUnit: z.enum(['BOX', 'PACK']).optional(),
})

export const createSuggestionSchema = z.object({
  nameEN: z.string().min(1),
  nameAR: z.string().min(1),
  descriptionEN: z.string().optional(),
  descriptionAR: z.string().optional(),
  images: z.array(z.string()).optional(),
  categorySuggestion: z.string().optional(),
})
