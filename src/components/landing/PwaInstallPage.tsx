'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChevronDown,
  Factory,
  Heart,
  LayoutGrid,
  MapPin,
  Package,
  ShoppingBag,
  Smartphone,
  Store,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import InstallModal from '@/components/InstallModal';

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)', lineHeight: 1.08, margin: '0 0 14px', color: 'var(--text-primary)' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      {...fadeUp}
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(99, 102, 241, 0.16)',
        borderRadius: 24,
        padding: '30px 20px',
        boxShadow: '0 18px 50px rgba(17, 24, 39, 0.08)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--primary)' }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 15, color: '#475569', fontWeight: 600 }}>{label}</div>
    </motion.div>
  );
}

function FeaturePill({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <motion.article
      {...fadeUp}
      whileHover={{ y: -4 }}
      style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
        border: '1px solid rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(124, 58, 237, 0.1))', color: 'var(--primary)', marginBottom: 16 }}>
        <Icon size={22} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#111827' }}>{title}</h3>
      <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{description}</p>
    </motion.article>
  );
}

export default function PwaInstallPage() {
  const t = useTranslations('landing');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { handleInstallClick, showIosModal, closeIosModal } = usePWAInstall();

  const navLinks = useMemo(
    () => [
      { label: t('nav.home'), href: '#home' },
      { label: t('nav.features'), href: '#features' },
      { label: t('nav.howItWorks'), href: '#how-it-works' },
      { label: t('nav.businesses'), href: '#businesses' },
      { label: t('nav.customers'), href: '#customers' },
      { label: t('nav.contact'), href: '#contact' },
    ],
    [t]
  );

  const trustedCompanies = useMemo(() => [t('trustedCompanies.factoryA'), t('trustedCompanies.freshFoods'), t('trustedCompanies.globalSupplier'), t('trustedCompanies.marketPlus'), t('trustedCompanies.retailPro')], [t]);

  const workflowSteps = useMemo(
    () => [
      {
        icon: Factory,
        title: t('workflow.factoryTitle'),
        description: t('workflow.factoryText'),
      },
      {
        icon: Package,
        title: t('workflow.supplierTitle'),
        description: t('workflow.supplierText'),
      },
      {
        icon: Store,
        title: t('workflow.storeTitle'),
        description: t('workflow.storeText'),
      },
      {
        icon: ShoppingBag,
        title: t('workflow.customerTitle'),
        description: t('workflow.customerText'),
      },
    ],
    [t]
  );

  const featureCards = useMemo(
    () => [
      { icon: Boxes, title: t('features.wholesaleTitle'), text: t('features.wholesaleText') },
      { icon: LayoutGrid, title: t('features.inventoryTitle'), text: t('features.inventoryText') },
      { icon: Zap, title: t('features.smartOrdersTitle'), text: t('features.smartOrdersText') },
      { icon: ShoppingBag, title: t('features.customerShoppingTitle'), text: t('features.customerShoppingText') },
      { icon: TrendingUp, title: t('features.analyticsTitle'), text: t('features.analyticsText') },
      { icon: Smartphone, title: t('features.notificationsTitle'), text: t('features.notificationsText') },
    ],
    [t]
  );

  const testimonials = useMemo(
    () => [
      { name: t('testimonials.ownerName'), role: t('testimonials.ownerRole'), quote: t('testimonials.ownerQuote') },
      { name: t('testimonials.supplierName'), role: t('testimonials.supplierRole'), quote: t('testimonials.supplierQuote') },
      { name: t('testimonials.manufacturerName'), role: t('testimonials.manufacturerRole'), quote: t('testimonials.manufacturerQuote') },
    ],
    [t]
  );

  const faqItems = useMemo(
    () => [
      { question: t('faq.whatIsAsshrabhaQuestion'), answer: t('faq.whatIsAsshrabhaAnswer') },
      { question: t('faq.whoCanJoinQuestion'), answer: t('faq.whoCanJoinAnswer') },
      { question: t('faq.isItFreeQuestion'), answer: t('faq.isItFreeAnswer') },
      { question: t('faq.installQuestion'), answer: t('faq.installAnswer') },
      { question: t('faq.factoriesQuestion'), answer: t('faq.factoriesAnswer') },
    ],
    [t]
  );

  const heroStats = useMemo(
    () => [
      { value: '500+', label: t('stats.products') },
      { value: '50+', label: t('stats.stores') },
      { value: '20+', label: t('stats.suppliers') },
      { value: '24/7', label: t('stats.availability') },
    ],
    [t]
  );

  const businessBenefits = useMemo(
    () => [
      t('businessChecks.trustedSuppliers'),
      t('businessChecks.visibility'),
      t('businessChecks.wholesaleOrders'),
      t('businessChecks.digitalInventory'),
      t('businessChecks.analyticsBoard'),
    ],
    [t]
  );

  const customerBenefits = useMemo(
    () => [
      { label: t('customerChecks.nearbyStores'), icon: MapPin },
      { label: t('customerChecks.fastCheckout'), icon: ShoppingBag },
      { label: t('customerChecks.savedOrders'), icon: Package },
      { label: t('customerChecks.offers'), icon: TrendingUp },
      { label: t('customerChecks.favorites'), icon: Heart },
      { label: t('customerChecks.deliveryTracking'), icon: Truck },
    ],
    [t]
  );

  const phonePreviewProducts = useMemo(
    () => [
      t('phonePreview.topProductItem1'),
      t('phonePreview.topProductItem2'),
      t('phonePreview.topProductItem3'),
    ],
    [t]
  );

  return (
    <main className="landing-page" dir="rtl" lang="ar" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', overflow: 'hidden', direction: 'rtl', textAlign: 'right' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: -100, width: 260, height: 260, borderRadius: '9999px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18), transparent 70%)' }} />
        <div style={{ position: 'absolute', top: 180, right: -90, width: 360, height: 360, borderRadius: '9999px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.16), transparent 72%)' }} />
      </div>

      <nav style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(18px)', background: 'rgba(248, 250, 252, 0.75)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexDirection: 'row-reverse' }}>
          <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#000', fontWeight: 800, flexDirection: 'row-reverse' }}>
            <img src="/icons/pwa-icon-512.png" alt="Ashrabha logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'cover', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.28)' }} />
            <span>Ashrabha</span>
          </a>
          <div style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap', flexDirection: 'row-reverse' }}>
            {navLinks.map((item) => (
              <a key={item.href} href={item.href} style={{ color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleInstallClick}
              style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', fontWeight: 700, borderRadius: 14, padding: '12px 18px', boxShadow: 'var(--shadow-primary)' }}
            >
              {t('cta.installApp')}
            </button>
          </div>
        </div>
      </nav>

      <section id="home" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '48px 20px 72px' }}>
        <div className="landing-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-hero-grid-columns, 1.02fr .98fr)', gap: 56, alignItems: 'center' }}>
          <motion.div {...fadeUp}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', fontWeight: 700, marginBottom: 24, flexDirection: 'row-reverse' }}>
              <Smartphone size={16} />
              {t('hero.badge')}
            </div>
            <h1 style={{ fontSize: 'clamp(2.9rem, 6vw, 4.5rem)', lineHeight: 1, margin: '0 0 18px', letterSpacing: '-0.04em', maxWidth: 700, color: 'var(--text-primary)' }}>
              {t('hero.title')}
            </h1>
            <p style={{ margin: '0 0 28px', color: 'var(--text-secondary)', fontSize: 20, maxWidth: 680, lineHeight: 1.8 }}>
              {t('hero.description')}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 30, flexDirection: 'row-reverse', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleInstallClick} style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', borderRadius: 16, padding: '14px 22px', fontWeight: 800, boxShadow: 'var(--shadow-primary)' }}>
                {t('cta.installPwa')}
              </button>
              <a href="#how-it-works" style={{ textDecoration: 'none', color: '#111827', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(99,102,241,0.16)', borderRadius: 16, padding: '14px 22px', fontWeight: 800, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
                {t('cta.learnMore')}
              </a>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', color: 'var(--text-secondary)', fontWeight: 600, flexDirection: 'row-reverse', justifyContent: 'flex-end' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Smartphone size={16} /> {t('hero.installReady')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> {t('hero.mobileExperience')}</span>
            </div>
          </motion.div>

          <motion.div className="landing-phone-preview" {...fadeUp} style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '100%', maxWidth: 320, minHeight: 560 }}>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' as const }}
              style={{ position: 'relative', width: '100%', maxWidth: 320, aspectRatio: '320 / 620', borderRadius: 36, padding: 14, background: 'linear-gradient(160deg, #241845, #4f46e5)', boxShadow: '0 35px 80px rgba(79,70,229,0.24)' }}
            >
              <div style={{ borderRadius: 28, background: 'linear-gradient(180deg, #f8fafc, #edf9f1)', height: '100%', padding: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, color: '#000' }}>Ashrabha</div>
                  <div style={{ width: 10, height: 10, borderRadius: '9999px', background: 'var(--secondary)' }} />
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, color: '#000' }}>{t('phonePreview.orders')}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('phonePreview.ordersCount')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: 10, borderRadius: 14, background: '#f1f5f9' }}><div style={{ fontSize: 12, color: '#0f172a' }}>{t('phonePreview.sales')}</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{t('phonePreview.salesValue')}</div></div>
                      <div style={{ padding: 10, borderRadius: 14, background: '#f1f5f9' }}><div style={{ fontSize: 12, color: '#0f172a' }}>{t('phonePreview.inventory')}</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{t('phonePreview.inventoryValue')}</div></div>
                    </div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800, color: '#000' }}>{t('phonePreview.topProducts')}</span>
                      <span style={{ fontSize: 13, color: '#000' }}>{t('phonePreview.live')}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {phonePreviewProducts.map((item, i) => (
                        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 12, background: i === 0 ? 'rgba(22,163,74,0.09)' : '#f8fafc' }}>
                          <span style={{ fontWeight: 700, color: '#000' }}>{item}</span>
                          <span style={{ color: '#000' }}>{t('phonePreview.available')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 20, padding: 16, color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800 }}>{t('phonePreview.salesGraph')}</span>
                      <span style={{ fontSize: 12, opacity: 0.9 }}>{t('phonePreview.thisWeek')}</span>
                    </div>
                    <div style={{ height: 86, display: 'flex', alignItems: 'end', gap: 8 }}>
                      {[35, 52, 44, 68, 76, 56, 84].map((height) => (
                        <div key={height} style={{ flex: 1, height: `${height}%`, borderRadius: 999, background: 'rgba(255,255,255,0.9)' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>{t('phonePreview.notifications')}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ color: '#0f172a', fontSize: 14 }}>{t('phonePreview.inventoryRestock')}</div>
                      <div style={{ color: '#0f172a', fontSize: 14 }}>{t('phonePreview.newSupplierApproved')}</div>
                      <div style={{ color: '#0f172a', fontSize: 14 }}>{t('phonePreview.customerReorderReady')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '16px 20px 72px' }}>
        <div className="landing-trusted-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-trusted-grid-columns, repeat(5, minmax(0, 1fr)))', gap: 20, alignItems: 'center' }}>
          {trustedCompanies.map((name) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(107,114,128,0.12)', borderRadius: 18, padding: '18px 16px', textAlign: 'center', color: '#000', fontWeight: 700, letterSpacing: 0.2 }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow={t('sections.howItWorksEyebrow')} title={t('sections.howItWorksTitle')} text={t('sections.howItWorksText')} />
        <div className="landing-workflow-grid" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'var(--landing-workflow-grid-columns, repeat(4, 1fr))', gap: 16 }}>
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} {...fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', border: '1px solid rgba(15,23,42,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(22,163,74,0.1)', color: '#16A34A', display: 'grid', placeItems: 'center' }}>
                    <Icon size={24} />
                  </div>
                  {index < workflowSteps.length - 1 && <ArrowRight color="var(--primary)" />}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 22, color: '#0f172a' }}>{step.title}</h3>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="features" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow={t('sections.featuresEyebrow')} title={t('sections.featuresTitle')} text={t('sections.featuresText')} />
        <div className="landing-features-grid" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'var(--landing-features-grid-columns, repeat(3, minmax(0, 1fr)))', gap: 18 }}>
          {featureCards.map((feature) => (
            <FeaturePill key={feature.title} icon={feature.icon} title={feature.title} description={feature.text} />
          ))}
        </div>
      </section>

      <section id="businesses" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div className="landing-businesses-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-businesses-grid-columns, 0.9fr 1.1fr)', gap: 38, alignItems: 'center' }}>
          <motion.div {...fadeUp} style={{ minHeight: 340, borderRadius: 32, background: 'linear-gradient(145deg, rgba(14,116,144,0.1), rgba(34,197,94,0.16))', border: '1px solid rgba(22,163,74,0.18)', display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'relative', width: 260, height: 260, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(22,163,74,0.4), rgba(245,158,11,0.25))', boxShadow: '0 25px 70px rgba(22,163,74,0.18)' }} />
          </motion.div>
          <motion.div {...fadeUp}>
            <SectionHeading eyebrow={t('sections.businessEyebrow')} title={t('sections.businessTitle')} text={t('sections.businessText')} />
            <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
              {businessBenefits.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, color: 'var(--text-primary)', flexDirection: 'row-reverse', justifyContent: 'flex-end' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '9999px', background: 'var(--primary-50)', display: 'grid', placeItems: 'center', color: 'var(--primary-light)' }}><BadgeCheck size={14} /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="customers" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div className="landing-customers-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-customers-grid-columns, 1fr 1fr)', gap: 36, alignItems: 'center' }}>
          <motion.div {...fadeUp}>
            <SectionHeading eyebrow={t('sections.customerEyebrow')} title={t('sections.customerTitle')} text={t('sections.customerText')} />
            <div className="landing-customer-benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-customer-benefits-grid-columns, repeat(2, 1fr))', gap: 12, marginTop: 28 }}>
              {customerBenefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ background: '#fff', padding: 16, borderRadius: 18, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 14px 35px rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.05)', flexDirection: 'row-reverse' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(99,102,241,0.10)', color: 'var(--primary)' }}><Icon size={18} /></span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
          <motion.div {...fadeUp} style={{ minHeight: 420, borderRadius: 32, background: 'linear-gradient(135deg, rgba(22,163,74,0.14), rgba(245,158,11,0.12))', display: 'grid', placeItems: 'center', border: '1px solid rgba(22,163,74,0.16)' }}>
            <div style={{ width: 'min(100%, 330px)', height: 420, borderRadius: 30, background: 'linear-gradient(180deg, #ffffff, #f6fdf8)', boxShadow: '0 28px 70px rgba(17,24,39,0.12)', padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, color: '#000' }}>{t('phonePreview.nearbyMarket')}</div>
                <div style={{ color: '#16A34A', fontWeight: 700 }}>{t('phonePreview.mins')}</div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: t('phonePreview.fruitsVeg') },
                  { label: t('phonePreview.dairy') },
                  { label: t('phonePreview.bakery') },
                ].map((item, i) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 16, padding: 14, flexDirection: 'row-reverse' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#000' }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: '#000' }}>{t('phonePreview.freshStock')}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{i === 1 ? '2x' : '4x'}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div className="landing-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-stats-grid-columns, repeat(4, 1fr))', gap: 18 }}>
          {heroStats.map((stat) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary-dark))', borderRadius: 36, padding: '56px 26px', color: '#fff', boxShadow: '0 24px 70px rgba(99, 102, 241, 0.28)' }}>
          <div className="landing-install-grid" style={{ display: 'grid', gridTemplateColumns: 'var(--landing-install-grid-columns, 1fr 1fr)', gap: 28, alignItems: 'center' }}>
            <motion.div {...fadeUp}>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.4, opacity: 0.92 }}>{t('installBadge')}</div>
              <h2 style={{ margin: '10px 0 12px', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#fff' }}>{t('installTitle')}</h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.94)', fontSize: 18, lineHeight: 1.8 }}>{t('installDescription')}</p>
              <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap', color: '#fff', flexDirection: 'row-reverse' }}>
                {['Android', 'Chrome', 'Edge', 'Safari'].map((item) => (
                  <div key={item} style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>{item}</div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeUp} style={{ display: 'grid', placeItems: 'center' }}>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' as const }}
                style={{ width: 280, height: 520, borderRadius: 34, background: 'linear-gradient(180deg, #fff, #f7f4ff)', padding: 12, boxShadow: '0 28px 80px rgba(0,0,0,0.24)' }}
              >
                <div style={{ borderRadius: 26, background: 'linear-gradient(180deg, #f8fafc, #f7f4ff)', height: '100%', padding: 16 }}>
                  <div style={{ fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>{t('installStepsTitle')}</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[
                      t('installSteps.step1'),
                      t('installSteps.step2'),
                      t('installSteps.step3'),
                    ].map((step, index) => (
                      <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 14, padding: 12, border: '1px solid rgba(99,102,241,0.14)' }}>
                        <span style={{ width: 28, height: 28, borderRadius: '9999px', background: 'var(--secondary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{index + 1}</span>
                        <span style={{ fontWeight: 700, color: '#111827' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={handleInstallClick} style={{ border: 'none', cursor: 'pointer', background: '#fff', color: 'var(--primary)', fontWeight: 800, padding: '16px 24px', borderRadius: 16, boxShadow: '0 16px 35px rgba(15,23,42,0.16)' }}>
              {t('cta.installNow')}
            </button>
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow={t('sections.testimonialsEyebrow')} title={t('sections.testimonialsTitle')} text={t('sections.testimonialsText')} />
        <div className="landing-testimonials-grid" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'var(--landing-testimonials-grid-columns, repeat(3, 1fr))', gap: 18 }}>
          {testimonials.map((person) => (
            <motion.article key={person.name} {...fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(22,163,74,0.18), rgba(245,158,11,0.2))', display: 'grid', placeItems: 'center', fontWeight: 800 }}>A</div>
                <div>
                  <div style={{ fontWeight: 800, color: '#000' }}>{person.name}</div>
                  <div style={{ color: '#0f172a', fontSize: 14 }}>{person.role}</div>
                </div>
              </div>
              <div style={{ color: 'var(--warning)', marginBottom: 12 }}>★★★★★</div>
              <p style={{ margin: 0, color: '#0f172a', lineHeight: 1.7 }}>{person.quote}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow={t('sections.faqEyebrow')} title={t('sections.faqTitle')} text={t('sections.faqText')} />
        <div style={{ marginTop: 28, display: 'grid', gap: 12 }}>
          {faqItems.map((item, index) => (
            <div key={item.question} style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.question}</span>
                <ChevronDown style={{ color: '#0f172a', transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {openFaq === index && <div style={{ padding: '0 22px 20px', color: '#0f172a', lineHeight: 1.8 }}>{item.answer}</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.92)', borderRadius: 32, padding: '56px 22px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem, 4.2vw, 3.2rem)', color: '#0f172a' }}>{t('cta.finalTitle')}</h2>
          <p style={{ margin: '0 auto 28px', maxWidth: 720, color: '#0f172a', fontSize: 18, lineHeight: 1.8 }}>
            {t('cta.finalDescription')}
          </p>
          <button type="button" onClick={handleInstallClick} style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #16A34A, #22C55E)', color: '#fff', fontWeight: 800, padding: '16px 24px', borderRadius: 16, boxShadow: '0 16px 35px rgba(22,163,74,0.34)' }}>
            {t('cta.installApp')}
          </button>
        </div>
      </section>

      <footer id="contact" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '16px 20px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800, marginBottom: 10 }}>
              <img src="/icons/pwa-icon-512.png" alt="Ashrabha logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
              Ashrabha
            </div>
            <div style={{ color: '#0f172a' }}>{t('footer.links')}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: '9999px', background: '#fff', color: 'var(--primary)', display: 'grid', placeItems: 'center', border: '1px solid rgba(15,23,42,0.08)', fontWeight: 800 }}>in</span>
            <span style={{ width: 34, height: 34, borderRadius: '9999px', background: '#fff', color: 'var(--primary)', display: 'grid', placeItems: 'center', border: '1px solid rgba(15,23,42,0.08)', fontWeight: 800 }}>x</span>
            <span style={{ width: 34, height: 34, borderRadius: '9999px', background: '#fff', color: 'var(--primary)', display: 'grid', placeItems: 'center', border: '1px solid rgba(15,23,42,0.08)', fontWeight: 800 }}>ig</span>
          </div>
        </div>
      </footer>

      <InstallModal open={showIosModal} onClose={closeIosModal} />
    </main>
  );
}
