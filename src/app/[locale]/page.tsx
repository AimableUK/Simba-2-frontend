import { getTranslations } from 'next-intl/server';
import { HeroSection } from '@/components/shop/hero-section';
import { FeaturedProducts } from '@/components/shop/featured-products';
import { TopProducts } from '@/components/shop/top-products';
import { RecommendedProducts } from '@/components/shop/recommended-products';
import { CategoryGrid } from '@/components/shop/category-grid';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: 'Simba Super Market - ' + t('hero.title') };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="space-y-0">
      <HeroSection />
      <CategoryGrid />
      <FeaturedProducts />
      <TopProducts />
      <RecommendedProducts />
    </div>
  );
}
