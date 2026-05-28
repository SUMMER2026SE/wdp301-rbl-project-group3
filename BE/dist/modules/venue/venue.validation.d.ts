import { z } from 'zod';
export declare const createVenueSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    pricePerHour: z.ZodNumber;
    openTime: z.ZodString;
    closeTime: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateVenueSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    pricePerHour: z.ZodOptional<z.ZodNumber>;
    openTime: z.ZodOptional<z.ZodString>;
    closeTime: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
//# sourceMappingURL=venue.validation.d.ts.map