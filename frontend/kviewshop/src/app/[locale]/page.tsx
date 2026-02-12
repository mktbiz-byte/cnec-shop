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
  Package,
  Store,
  BarChart3,
  Shield,
  Zap,
  Users,
  CheckCircle2,
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

  const forCreators = [
    {
      icon: ShoppingBag,
      title: locale === 'ko' ? '상품만 고르세요' : 'Just Pick Products',
      desc: locale === 'ko' ? '기업이 등록한 검증된 공구 상품 중 마음에 드는 상품을 골라 내 샵에 추가하세요' : 'Browse verified group-buy products from brands and add them to your shop',
    },
    {
      icon: Megaphone,
      title: locale === 'ko' ? '판매만 집중하세요' : 'Focus Only on Selling',
      desc: locale === 'ko' ? 'SNS, 유튜브, 라이브 방송으로 판매만 하면 됩니다. 재고 걱정 없어요' : 'Sell through SNS, YouTube, live streams. No inventory worries',
    },
    {
      icon: Wallet,
      title: locale === 'ko' ? '수익은 자동 정산' : 'Auto Revenue Settlement',
      desc: locale === 'ko' ? '판매 실적에 따른 수수료가 매월 자동으로 정산됩니다' : 'Commission based on sales performance, settled automatically every month',
    },
  ];

  const forBrands = [
    {
      icon: Store,
      title: locale === 'ko' ? '상품 등록' : 'Register Products',
      desc: locale === 'ko' ? '공구 상품을 등록하면 크리에이터들이 선택하여 판매합니다' : 'Register products and creators will pick and sell them',
    },
    {
      icon: Users,
      title: locale === 'ko' ? '크리에이터 네트워크' : 'Creator Network',
      desc: locale === 'ko' ? '1,200+ 크리에이터가 내 상품을 홍보하고 판매합니다' : '1,200+ creators promote and sell your products',
    },
    {
      icon: BarChart3,
      title: locale === 'ko' ? '매출 확대' : 'Scale Revenue',
      desc: locale === 'ko' ? '다양한 채널을 통해 상품 노출과 매출을 극대화하세요' : 'Maximize product exposure and sales through diverse channels',
    },
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
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-3.5 w-3.5" />
              {locale === 'ko' ? '크리에이터 공구 플랫폼' : 'Creator Group-Buy Platform'}
            </motion.div>

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

      {/* How It Works - Flow Visualization */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-headline text-3xl font-bold md:text-4xl">{t('howItWorks')}</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {locale === 'ko'
                ? '기업이 상품을 등록하면 크리에이터가 선택하여 판매합니다. 나머지는 KviewShop이 처리합니다.'
                : 'Brands register products, creators pick and sell them. KviewShop handles the rest.'}
            </p>
          </motion.div>

          {/* Flow: Brand → KviewShop → Creator */}
          <motion.div
            className="mt-16 grid md:grid-cols-3 gap-4 md:gap-0 max-w-5xl mx-auto items-start"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {/* Brand Side */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-8 text-center card-hover"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Package className="h-8 w-8 text-accent" />
              </div>
              <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-3">
                {locale === 'ko' ? '기업(브랜드)' : 'Brand'}
              </span>
              <h3 className="text-lg font-semibold mb-2">
                {locale === 'ko' ? '공구 상품 등록' : 'Register Products'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {locale === 'ko'
                  ? '검증된 공구 상품을 등록하고 크리에이터에게 판매를 맡기세요'
                  : 'Register verified products and let creators handle the sales'}
              </p>
            </motion.div>

            {/* Center - KviewShop */}
            <motion.div
              className="relative flex flex-col items-center"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              {/* Arrow Left */}
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
                <ChevronRight className="h-6 w-6 text-primary/40" />
              </div>
              {/* Arrow Right */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
                <ChevronRight className="h-6 w-6 text-primary/40" />
              </div>

              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center w-full">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
                  KviewShop
                </span>
                <h3 className="text-lg font-semibold mb-2">
                  {locale === 'ko' ? '원스톱 운영 대행' : 'One-Stop Operations'}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{locale === 'ko' ? 'C/S 고객 대응' : 'Customer Service'}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{locale === 'ko' ? '배송 및 물류' : 'Shipping & Logistics'}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{locale === 'ko' ? '정산 자동화' : 'Auto Settlement'}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{locale === 'ko' ? '교환/반품 처리' : 'Returns & Exchanges'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Creator Side */}
            <motion.div
              className="rounded-2xl border border-border bg-card p-8 text-center card-hover"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Megaphone className="h-8 w-8 text-primary" />
              </div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
                {locale === 'ko' ? '크리에이터' : 'Creator'}
              </span>
              <h3 className="text-lg font-semibold mb-2">
                {locale === 'ko' ? '상품 선택 & 판매' : 'Pick & Sell'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {locale === 'ko'
                  ? '원하는 상품을 골라 내 샵에 추가하고 SNS, 라이브로 판매하세요'
                  : 'Pick products for your shop and sell through SNS and live streams'}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Process */}
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
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
              {locale === 'ko' ? '크리에이터 3단계' : '3 Steps for Creators'}
            </h2>
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

      {/* For Creators / For Brands */}
      <section className="py-20 md:py-28 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Creators */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                  {locale === 'ko' ? '크리에이터' : 'For Creators'}
                </span>
                <h3 className="font-headline text-2xl font-bold md:text-3xl mb-8">
                  {locale === 'ko' ? '판매에만 집중하세요' : 'Focus Only on Sales'}
                </h3>
              </motion.div>
              <div className="space-y-6">
                {forCreators.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-4"
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="mt-8">
                <Link href={`/${locale}/creator/login`}>
                  <Button size="lg" className="btn-gold">
                    {t('creatorCta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* For Brands */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-4">
                  {locale === 'ko' ? '기업(브랜드)' : 'For Brands'}
                </span>
                <h3 className="font-headline text-2xl font-bold md:text-3xl mb-8">
                  {locale === 'ko' ? '크리에이터에게 판매를 맡기세요' : 'Let Creators Sell for You'}
                </h3>
              </motion.div>
              <div className="space-y-6">
                {forBrands.map((item) => (
                  <motion.div
                    key={item.title}
                    className="flex gap-4"
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className="mt-8">
                <Link href={`/${locale}/brand/login`}>
                  <Button variant="outline" size="lg">
                    {t('brandCta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
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
