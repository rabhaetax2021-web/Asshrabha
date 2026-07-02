import { z } from 'zod'

const priceRangeSchema = z.object({
  wholesaleMinPrice: z.number().nonnegative(),
  wholesaleMaxPrice: z.number().nonnegative(),
  retailMinPrice: z.number().nonnegative(),
  retailMaxPrice: z.number().nonnegative(),
})

export const categorySchema = z.object({
  nameEN: z.string().min(1),
  nameAR: z.string().min(1),
  slug: z.string().min(1).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
})

export const catalogProductSchema = z.object({
  categoryId: z.string().min(1),
  nameEN: z.string().min(1),
  nameAR: z.string().min(1),
  wholesaleMinPrice: z.number().nonnegative(),
  wholesaleMaxPrice: z.number().nonnegative(),
  retailMinPrice: z.number().nonnegative(),
  retailMaxPrice: z.number().nonnegative(),
  unitType: z.enum(['PIECE', 'BOX', 'PACK']),
  images: z.union([z.array(z.string()), z.string()]).optional(),
  descriptionEN: z.string().optional(),
  descriptionAR: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
}).refine((data) => data.wholesaleMinPrice <= data.wholesaleMaxPrice, {
  message: 'Wholesale min price must be less than or equal to wholesale max price',
  path: ['wholesaleMinPrice'],
}).refine((data) => data.retailMinPrice <= data.retailMaxPrice, {
  message: 'Retail min price must be less than or equal to retail max price',
  path: ['retailMinPrice'],
})

export const catalogProductUpdateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  nameEN: z.string().min(1).optional(),
  nameAR: z.string().min(1).optional(),
  wholesaleMinPrice: z.number().nonnegative().optional(),
  wholesaleMaxPrice: z.number().nonnegative().optional(),
  retailMinPrice: z.number().nonnegative().optional(),
  retailMaxPrice: z.number().nonnegative().optional(),
  unitType: z.enum(['PIECE', 'BOX', 'PACK']).optional(),
  images: z.union([z.array(z.string()), z.string()]).optional(),
  descriptionEN: z.string().optional(),
  descriptionAR: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
}).superRefine((data, ctx) => {
  if (data.wholesaleMinPrice !== undefined && data.wholesaleMaxPrice !== undefined && data.wholesaleMinPrice > data.wholesaleMaxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Wholesale min price must be less than or equal to wholesale max price', path: ['wholesaleMinPrice'] })
  }
  if (data.retailMinPrice !== undefined && data.retailMaxPrice !== undefined && data.retailMinPrice > data.retailMaxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Retail min price must be less than or equal to retail max price', path: ['retailMinPrice'] })
  }
})

export const catalogProductRangeSchema = priceRangeSchema.superRefine((data, ctx) => {
  if (data.wholesaleMinPrice > data.wholesaleMaxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Wholesale min price must be less than or equal to wholesale max price', path: ['wholesaleMinPrice'] })
  }
  if (data.retailMinPrice > data.retailMaxPrice) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Retail min price must be less than or equal to retail max price', path: ['retailMinPrice'] })
  }
})
