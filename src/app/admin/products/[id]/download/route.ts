import { prisma } from "@/app/db/db";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const product = await prisma.product.findUnique({
        where: { id: params.id },
        select: {
            filePath: true,
            name: true,
        },
    });

    if(product == null) return notFound();

    const { size } = await fs.stat(product.filePath);
    const file = await fs.readFile(product.filePath);
    const extension = product.filePath.split(".").pop();

    return new NextResponse(file, {
        headers: {
            "Content-Disposition": `attachment; filename="${product.name}.${extension}"`,
            "Content-Length": size.toString(),
        }
    })
}