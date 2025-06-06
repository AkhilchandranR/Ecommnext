import { prisma } from "@/app/db/db";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Suspense } from "react";

const getProducts = () => {
    return prisma.product.findMany({
        where: { isAvailableForPurchase: true },
        orderBy: { name: "asc" },
    });
}

export default function ProductPage() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Suspense fallback={
                <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                </>
            }>
                    <ProductsSuspense />
            </Suspense>
        </div> 
    )
}

async function ProductsSuspense() {
    const products = await getProducts();
    return (
        products.map((product) => (
                <ProductCard 
                    key={product.id}
                    {...product}
                />
        )
    ))
};