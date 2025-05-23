"use server";

import { prisma } from "@/app/db/db";
import { z } from "zod";
import fs from "fs/promises";
import { notFound, redirect } from "next/navigation";

const fileSchema = z.instanceof(File, { message: "Required" });
const imageSchema = fileSchema.refine((file) => file.size === 0 || file.type.startsWith("image/"));

const addSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    priceInCents: z.coerce.number().int().min(1),
    file: fileSchema.refine(file => file.size > 0, "Required"),
    image: imageSchema.refine(file => file.size > 0, "Required"),
});

export async function createProduct(prevState: unknown, formData: FormData) {
    const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
        return result.error.formErrors.fieldErrors;
    }

    const data = result.data;
    const { name, description, priceInCents, file, image } = data;

    //filepath
    await fs.mkdir("products", { recursive: true });
    const filePath = `products/${crypto.randomUUID()}-${file.name}`;
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    //imagepath
    await fs.mkdir("public/products", { recursive: true });
    const imagePath = `/products/${crypto.randomUUID()}-${image.name}`;
    await fs.writeFile(`public${imagePath}`, Buffer.from(await image.arrayBuffer()));

    await prisma.product.create({ data: {
        isAvailableForPurchase: false,
        name,
        description,
        priceInCents,
        filePath,
        imagePath
    }});

    redirect("/admin/products");
}

export async function toggleProductAvailability(id: string, isAvailableForPurchase: boolean) {
    await prisma.product.update({
        where: { id },
        data: { isAvailableForPurchase }
    });
};

export async function deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
        throw new Error("Product not found");
    }

    await prisma.product.delete({ where: { id } });
    await fs.unlink(product.filePath);
    await fs.unlink(`public${product.imagePath}`);
};

const editSchema = addSchema.extend({
    file: fileSchema.optional(),
    image: imageSchema.optional(),
});

export async function updateProduct(id: string, prevState: unknown, formData: FormData) {
    const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
        return result.error.formErrors.fieldErrors;
    }

    const data = result.data;
    const product = await prisma.product.findUnique({ where: { id } });
    if (product == null) return notFound();

    let filePath = product.filePath;
    if (data.file !== null && data.file && data.file.size > 0) {
        await fs.unlink(product.filePath);
        filePath = `products/${crypto.randomUUID()}-${data.file?.name}`;
        await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
    }

    let imagePath = product.imagePath;
     if (data.image !== null && data.image && data.image.size > 0) {
        await fs.unlink(product.imagePath);
        imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
        await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer()));
    }

    await prisma.product.update({ 
        where: { id },
        data: {
        isAvailableForPurchase: false,
        name: data.name,
        description: data.description,
        priceInCents: data.priceInCents,
        filePath,
        imagePath
    }});

    redirect("/admin/products");
}

