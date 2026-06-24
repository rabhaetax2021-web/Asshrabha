import { z } from 'zod'

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
}).refine((data) => data.wholesaleMinPrice <= data.wholesaleMaxPrice, {
  message: 'Wholesale min price must be less than or equal to wholesale max price',
  path: ['wholesaleMinPrice'],
}).refine((data) => data.retailMinPrice <= data.retailMaxPrice, {
  message: 'Retail min price must be less than or equal to retail max price',
  path: ['retailMinPrice'],
})
