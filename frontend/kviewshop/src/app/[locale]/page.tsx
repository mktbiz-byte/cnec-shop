'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Megaphone,
  Wallet,
  Headphones,
  Truck,
  BadgeCheck,
  ArrowRight,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/shop/legal-footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function HomePage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('home');

  const steps = [
    { icon: ShoppingBag, title: t('step1Title'), desc: t('step1Desc') },
    { icon: Megaphone, title: t('step2Title'), desc: t('step2Desc') },
    { icon: Wallet, title: t('step3Title'), desc: t('step3Desc') },
  ];

  const benefits = [
    { icon: Headphones, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: Truck, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: Wallet, title: t('benefit3Title'), desc: t('benefit3Desc') },
    { icon: BadgeCheck, title: t('benefit4Title'), desc: t('benefit4Desc') },
  ];

  const stats = [
    { value: '500+', label: t('stats.products') },
    { value: '1,200+', label: t('stats.creators') },
    { value: '11', label: t('stats.countries') },
    { value: '80+', label: t('stats.brands') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="font-headline text-xl font-bold text-gold-gradient">
            KviewShop
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/creator/login`}>
              <Button variant="ghost" size="sm">
                {t('creatorCta')}
              </Button>
            </Link>
            <Link href={`/${locale}/brand/login`}>
              <Button variant="outline" size="sm">
                {t('brandCta')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              className="font-headline text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('title')}
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-muted-foreground md:text-xl whitespace-pre-line leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Link href={`/${locale}/creator/login`}>
                <Button size="lg" className="btn-gold w-full sm:w-auto text-base px-8 py-6">
                  {t('creatorCta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/brand/login`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                  {t('brandCta')}
                </Button>
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 text-sm text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Link
                href={`/${locale}/buyer/login`}
                className="hover:text-foreground transition-colors underline underline-offset-4"
              >
                {t('loginLink')}
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} className="text-center" variants={fadeInUp} transition={{ duration: 0.4 }}>
                <p className="stat-value text-3xl md:text-4xl text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('howItWorks')}</h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative rounded-2xl border border-border bg-card p-8 card-hover"
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute top-6 right-8 text-5xl font-bold text-muted/50">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section className="py-20 md:py-28 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('featuredProducts')}</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t('featuredProductsDesc')}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border bg-card overflow-hidden card-hover"
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="aspect-square bg-muted animate-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted animate-shimmer" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-shimmer" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <Link href={`/${locale}/creator/login`}>
              <Button variant="outline" size="lg">
                {t('browseProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('whyKviewshop')}</h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                className="rounded-2xl border border-border bg-card p-6 card-hover text-center"
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Global Reach */}
      <section className="py-16 border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <Globe className="h-10 w-10 text-primary shrink-0" />
            <div>
              <h3 className="text-xl font-semibold">
                {locale === 'ko' ? '전세계 11개국 배송 인프라' : 'Global Shipping to 11 Countries'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {locale === 'ko'
                  ? '일본, 미국, 중국, 동남아, 유럽 등 전세계 크리에이터와 함께하세요'
                  : 'Connect with creators worldwide — Japan, US, China, SEA, Europe and more'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.h2
              className="font-headline text-3xl font-bold md:text-5xl"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('ctaTitle')}
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {t('ctaDesc')}
            </motion.p>
            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Link href={`/${locale}/creator/login`}>
                <Button size="lg" className="btn-gold w-full sm:w-auto text-base px-8 py-6">
                  {t('creatorCta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/brand/login`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                  {t('brandCta')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
