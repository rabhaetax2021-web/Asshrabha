'use client';

import { useMemo, useState } from 'react';
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

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Businesses', href: '#businesses' },
  { label: 'Customers', href: '#customers' },
  { label: 'Contact', href: '#contact' },
];

const trustedCompanies = ['Factory A', 'Fresh Foods', 'Global Supplier', 'Market+', 'Retail Pro'];

const workflowSteps = [
  {
    icon: Factory,
    title: 'Factory',
    description: 'Manufacturers publish production capacity, pricing, and available stock in real time.',
  },
  {
    icon: Package,
    title: 'Supplier',
    description: 'Suppliers connect inventory, fulfilment timelines, and wholesale catalog listings.',
  },
  {
    icon: Store,
    title: 'Grocery Store',
    description: 'Retailers discover trusted stock, place orders, and manage demand from one dashboard.',
  },
  {
    icon: ShoppingBag,
    title: 'Customer',
    description: 'Customers shop nearby stores, reorder favorites, and track delivery progress instantly.',
  },
];

const featureCards = [
  {
    icon: Boxes,
    title: 'Wholesale Marketplace',
    text: 'Compare suppliers instantly and source the right stock with transparent pricing.',
  },
  {
    icon: LayoutGrid,
    title: 'Inventory Management',
    text: 'Monitor live stock positions, allocate orders, and prevent shortages before they happen.',
  },
  {
    icon: Zap,
    title: 'Smart Orders',
    text: 'Reorder products automatically with demand-driven recommendations and fast fulfillment.',
  },
  {
    icon: ShoppingBag,
    title: 'Customer Shopping',
    text: 'Consumers browse local stores, reorder saved items, and complete checkout in seconds.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics',
    text: 'Track sales velocity, supplier performance, and regional demand across your network.',
  },
  {
    icon: Smartphone,
    title: 'Notifications',
    text: 'Receive real-time activity alerts for inventory shifts, order changes, and approvals.',
  },
];

const testimonials = [
  {
    name: 'Owner of Grocery Store',
    role: 'Retail excellence',
    quote: 'Asshrabha helped us replace scattered calls with one clean ordering workflow and better stock visibility.',
  },
  {
    name: 'Supplier',
    role: 'Distribution partner',
    quote: 'The platform makes catalog discovery and order intake effortless for every retail customer we serve.',
  },
  {
    name: 'Manufacturer',
    role: 'Production lead',
    quote: 'We can coordinate brand demand, pricing, and fulfillment much faster without switching tools.',
  },
];

const faqItems = [
  {
    question: 'What is Asshrabha?',
    answer: 'Asshrabha is a progressive web app that connects every part of the grocery supply chain, from production to store checkout and customer delivery.',
  },
  {
    question: 'Who can join?',
    answer: 'Factories, manufacturers, suppliers, wholesalers, grocery stores, and end customers can all operate on the same trusted network.',
  },
  {
    question: 'Is it free?',
    answer: 'The platform is designed to be flexible for teams of all sizes, with business-ready workflows and install-free access through a browser-first PWA experience.',
  },
  {
    question: 'How do I install the app?',
    answer: 'Use the browser install prompt from the landing page or any supported browser, then launch it directly from your home screen or app launcher.',
  },
  {
    question: 'Can factories register?',
    answer: 'Yes. Factories and manufacturers can register, publish network availability, and manage supplier and store coordination from a shared operational view.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ color: '#16A34A', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)', lineHeight: 1.08, margin: '0 0 14px', color: '#111827' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 18, color: '#6B7280', lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      {...fadeUp}
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(22, 163, 74, 0.12)',
        borderRadius: 24,
        padding: '30px 20px',
        boxShadow: '0 18px 50px rgba(17, 24, 39, 0.08)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 800, color: '#16A34A' }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 15, color: '#6B7280', fontWeight: 600 }}>{label}</div>
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
      <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(22,163,74,0.16), rgba(34,197,94,0.08))', color: '#16A34A', marginBottom: 16 }}>
        <Icon size={22} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#111827' }}>{title}</h3>
      <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.7 }}>{description}</p>
    </motion.article>
  );
}

export default function PwaInstallPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { handleInstallClick, showIosModal, closeIosModal } = usePWAInstall();

  const heroStats = useMemo(
    () => [
      { value: '500+', label: 'Products' },
      { value: '50+', label: 'Stores' },
      { value: '20+', label: 'Suppliers' },
      { value: '24/7', label: 'Availability' },
    ],
    []
  );

  return (
    <main style={{ background: '#F8FAFC', color: '#111827', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: -100, width: 260, height: 260, borderRadius: '9999px', background: 'radial-gradient(circle, rgba(22, 163, 74, 0.18), transparent 70%)' }} />
        <div style={{ position: 'absolute', top: 180, right: -90, width: 360, height: 360, borderRadius: '9999px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16), transparent 72%)' }} />
      </div>

      <nav style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(18px)', background: 'rgba(248, 250, 252, 0.75)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#111827', fontWeight: 800 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #16A34A, #22C55E)', display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 10px 30px rgba(22, 163, 74, 0.28)' }}>
              A
            </div>
            <span>Asshrabha</span>
          </a>
          <div style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
            {navLinks.map((item) => (
              <a key={item.href} href={item.href} style={{ color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleInstallClick}
              style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #16A34A, #22C55E)', color: '#fff', fontWeight: 700, borderRadius: 14, padding: '12px 18px', boxShadow: '0 14px 30px rgba(22,163,74,0.35)' }}
            >
              Install App
            </button>
          </div>
        </div>
      </nav>

      <section id="home" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '48px 20px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.02fr .98fr', gap: 56, alignItems: 'center' }}>
          <motion.div {...fadeUp}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontWeight: 700, marginBottom: 24 }}>
              <Smartphone size={16} />
              PWA-powered commerce network
            </div>
            <h1 style={{ fontSize: 'clamp(2.9rem, 6vw, 4.5rem)', lineHeight: 1, margin: '0 0 18px', letterSpacing: '-0.04em', maxWidth: 700 }}>
              Connecting Factories, Suppliers, Grocery Stores & Customers in One Platform
            </h1>
            <p style={{ margin: '0 0 28px', color: '#6B7280', fontSize: 20, maxWidth: 680, lineHeight: 1.8 }}>
              Manage sourcing, discover suppliers, streamline wholesale purchasing, and shop from trusted local grocery stores—all from one Progressive Web App.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
              <button type="button" onClick={handleInstallClick} style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #16A34A, #22C55E)', color: '#fff', borderRadius: 16, padding: '14px 22px', fontWeight: 800, boxShadow: '0 16px 35px rgba(22,163,74,0.34)' }}>
                Install PWA
              </button>
              <a href="#how-it-works" style={{ textDecoration: 'none', color: '#111827', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, padding: '14px 22px', fontWeight: 800, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
                Learn More
              </a>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', color: '#6B7280', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Smartphone size={16} /> Install badge ready</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> Smooth mobile-first experience</span>
            </div>
          </motion.div>

          <motion.div {...fadeUp} style={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: 560 }}>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' as const }}
              style={{ position: 'relative', width: 320, height: 620, borderRadius: 36, padding: 14, background: 'linear-gradient(160deg, #0f172a, #1e3a2f)', boxShadow: '0 35px 80px rgba(15,23,42,0.24)' }}
            >
              <div style={{ borderRadius: 28, background: 'linear-gradient(180deg, #f8fafc, #edf9f1)', height: '100%', padding: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, color: '#111827' }}>Asshrabha</div>
                  <div style={{ width: 10, height: 10, borderRadius: '9999px', background: '#22C55E' }} />
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, color: '#111827' }}>Orders</span>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>12 new</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: 10, borderRadius: 14, background: '#f1f5f9' }}><div style={{ fontSize: 12, color: '#6B7280' }}>Sales</div><div style={{ fontWeight: 800 }}>EGP 48.3k</div></div>
                      <div style={{ padding: 10, borderRadius: 14, background: '#f1f5f9' }}><div style={{ fontSize: 12, color: '#6B7280' }}>Inventory</div><div style={{ fontWeight: 800 }}>93%</div></div>
                    </div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800 }}>Top Products</span>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>Live</span>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {['Rice', 'Tomatoes', 'Milk'].map((item, i) => (
                        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 12, background: i === 0 ? 'rgba(22,163,74,0.09)' : '#f8fafc' }}>
                          <span style={{ fontWeight: 700 }}>{item}</span>
                          <span style={{ color: '#6B7280' }}>24 units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)', borderRadius: 20, padding: 16, color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800 }}>Sales graph</span>
                      <span style={{ fontSize: 12, opacity: 0.9 }}>This week</span>
                    </div>
                    <div style={{ height: 86, display: 'flex', alignItems: 'end', gap: 8 }}>
                      {[35, 52, 44, 68, 76, 56, 84].map((height) => (
                        <div key={height} style={{ flex: 1, height: `${height}%`, borderRadius: 999, background: 'rgba(255,255,255,0.9)' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Notifications</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ color: '#6B7280', fontSize: 14 }}>• Inventory re-stock at Fresh Foods</div>
                      <div style={{ color: '#6B7280', fontSize: 14 }}>• New supplier approved</div>
                      <div style={{ color: '#6B7280', fontSize: 14 }}>• Customer reorder ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '16px 20px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 20, alignItems: 'center' }}>
          {trustedCompanies.map((name) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(107,114,128,0.12)', borderRadius: 18, padding: '18px 16px', textAlign: 'center', color: '#6B7280', fontWeight: 700, letterSpacing: 0.2 }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow="How it works" title="One Platform. Four Connected Businesses." text="Every role in the grocery network works together through a single shared system that reduces friction and improves visibility." />
        <div style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} {...fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', border: '1px solid rgba(15,23,42,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(22,163,74,0.1)', color: '#16A34A', display: 'grid', placeItems: 'center' }}>
                    <Icon size={24} />
                  </div>
                  {index < workflowSteps.length - 1 && <ArrowRight color="#16A34A" />}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 22, color: '#111827' }}>{step.title}</h3>
                <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.7 }}>{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="features" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow="Features" title="Built for every layer of grocery commerce" text="Asshrabha helps buyers, sellers, and operators move from manual sourcing to an intelligent network that scales with demand." />
        <div style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
          {featureCards.map((feature) => (
            <FeaturePill key={feature.title} icon={feature.icon} title={feature.title} description={feature.text} />
          ))}
        </div>
      </section>

      <section id="businesses" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 38, alignItems: 'center' }}>
          <motion.div {...fadeUp} style={{ minHeight: 340, borderRadius: 32, background: 'linear-gradient(145deg, rgba(14,116,144,0.1), rgba(34,197,94,0.16))', border: '1px solid rgba(22,163,74,0.18)', display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'relative', width: 260, height: 260, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(22,163,74,0.4), rgba(245,158,11,0.25))', boxShadow: '0 25px 70px rgba(22,163,74,0.18)' }} />
          </motion.div>
          <motion.div {...fadeUp}>
            <SectionHeading eyebrow="Business solutions" title="Grow Your Business" text="Connect with verified suppliers, raise visibility across your market, and manage wholesale operations from one reliable workflow." />
            <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
              {[
                'Connect with verified suppliers',
                'Increase visibility',
                'Manage wholesale orders',
                'Digital inventory',
                'Analytics dashboard',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, color: '#111827' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '9999px', background: '#dcfce7', display: 'grid', placeItems: 'center', color: '#16A34A' }}><BadgeCheck size={14} /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="customers" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'center' }}>
          <motion.div {...fadeUp}>
            <SectionHeading eyebrow="Customer experience" title="Shop faster, track smarter, reorder easily" text="Customers can discover nearby stores, access trusted offers, and keep every order within one beautifully organized experience." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 28 }}>
              {[
                { label: 'Nearby stores', icon: MapPin },
                { label: 'Fast checkout', icon: ShoppingBag },
                { label: 'Saved orders', icon: Package },
                { label: 'Offers', icon: TrendingUp },
                { label: 'Favorites', icon: Heart },
                { label: 'Delivery tracking', icon: Truck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ background: '#fff', padding: 16, borderRadius: 18, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 14px 35px rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.05)' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(22,163,74,0.08)', color: '#16A34A' }}><Icon size={18} /></span>
                    <span style={{ fontWeight: 700 }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
          <motion.div {...fadeUp} style={{ minHeight: 420, borderRadius: 32, background: 'linear-gradient(135deg, rgba(22,163,74,0.14), rgba(245,158,11,0.12))', display: 'grid', placeItems: 'center', border: '1px solid rgba(22,163,74,0.16)' }}>
            <div style={{ width: 330, height: 420, borderRadius: 30, background: 'linear-gradient(180deg, #ffffff, #f6fdf8)', boxShadow: '0 28px 70px rgba(17,24,39,0.12)', padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 800 }}>Nearby Market</div>
                <div style={{ color: '#16A34A', fontWeight: 700 }}>12 mins</div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {['Fruits & Veg', 'Dairy', 'Bakery'].map((item, i) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 16, padding: 14 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{item}</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>Fresh stock available</div>
                    </div>
                    <div style={{ color: '#16A34A', fontWeight: 700 }}>{i === 1 ? '2x' : '4x'}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {heroStats.map((stat) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0f5133, #16A34A)', borderRadius: 36, padding: '56px 26px', color: '#fff', boxShadow: '0 24px 70px rgba(22,163,74,0.24)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'center' }}>
            <motion.div {...fadeUp}>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.4, opacity: 0.8 }}>PWA install</div>
              <h2 style={{ margin: '10px 0 12px', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)' }}>Install Asshrabha Today</h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.88)', fontSize: 18, lineHeight: 1.8 }}>Install directly from your browser. No App Store required.</p>
              <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap', color: 'rgba(255,255,255,0.88)' }}>
                {['Android', 'Chrome', 'Edge', 'Safari'].map((item) => (
                  <div key={item} style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)' }}>{item}</div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeUp} style={{ display: 'grid', placeItems: 'center' }}>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' as const }}
                style={{ width: 280, height: 520, borderRadius: 34, background: 'linear-gradient(180deg, #fff, #effaf2)', padding: 12, boxShadow: '0 28px 80px rgba(0,0,0,0.24)' }}
              >
                <div style={{ borderRadius: 26, background: 'linear-gradient(180deg, #f8fafc, #effaf2)', height: '100%', padding: 16 }}>
                  <div style={{ fontWeight: 800, marginBottom: 14 }}>Install steps</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {['Open website', 'Tap Install', 'Start using instantly'].map((step, index) => (
                      <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 14, padding: 12 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '9999px', background: '#16A34A', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{index + 1}</span>
                        <span style={{ fontWeight: 700 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={handleInstallClick} style={{ border: 'none', cursor: 'pointer', background: '#fff', color: '#16A34A', fontWeight: 800, padding: '16px 24px', borderRadius: 16, boxShadow: '0 16px 35px rgba(15,23,42,0.16)' }}>
              Install Now
            </button>
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow="Testimonials" title="Trusted by modern grocery teams" text="Operators across the supply chain rely on Asshrabha to tighten communication, reduce delays, and improve store-level performance." />
        <div style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {testimonials.map((person) => (
            <motion.article key={person.name} {...fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(22,163,74,0.18), rgba(245,158,11,0.2))', display: 'grid', placeItems: 'center', fontWeight: 800 }}>A</div>
                <div>
                  <div style={{ fontWeight: 800 }}>{person.name}</div>
                  <div style={{ color: '#6B7280', fontSize: 14 }}>{person.role}</div>
                </div>
              </div>
              <div style={{ color: '#F59E0B', marginBottom: 12 }}>★★★★★</div>
              <p style={{ margin: 0, color: '#6B7280', lineHeight: 1.7 }}>{person.quote}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', padding: '56px 20px 72px' }}>
        <SectionHeading eyebrow="FAQ" title="Common questions" text="Everything you need to know about how Asshrabha brings the network together." />
        <div style={{ marginTop: 28, display: 'grid', gap: 12 }}>
          {faqItems.map((item, index) => (
            <div key={item.question} style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: '100%', border: 'none', background: 'transparent', padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontWeight: 800, color: '#111827' }}>{item.question}</span>
                <ChevronDown style={{ color: '#6B7280', transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {openFaq === index && <div style={{ padding: '0 22px 20px', color: '#6B7280', lineHeight: 1.8 }}>{item.answer}</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '56px 20px 72px' }}>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.92)', borderRadius: 32, padding: '56px 22px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem, 4.2vw, 3.2rem)', color: '#111827' }}>Ready to Transform Grocery Commerce?</h2>
          <p style={{ margin: '0 auto 28px', maxWidth: 720, color: '#6B7280', fontSize: 18, lineHeight: 1.8 }}>
            Whether you&apos;re a manufacturer, supplier, grocery store, or customer, Asshrabha connects everyone on one smart platform.
          </p>
          <button type="button" onClick={handleInstallClick} style={{ border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #16A34A, #22C55E)', color: '#fff', fontWeight: 800, padding: '16px 24px', borderRadius: 16, boxShadow: '0 16px 35px rgba(22,163,74,0.34)' }}>
            Install App
          </button>
        </div>
      </section>

      <footer id="contact" style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '16px 20px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid rgba(15,23,42,0.08)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16A34A, #22C55E)', display: 'grid', placeItems: 'center', color: '#fff' }}>A</div>
              Asshrabha
            </div>
            <div style={{ color: '#6B7280' }}>About · Products · Support · Privacy · Terms · Contact</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: '9999px', background: '#fff', display: 'grid', placeItems: 'center', border: '1px solid rgba(15,23,42,0.08)' }}>in</span>
            <span style={{ width: 34, height: 34, borderRadius: '9999px', background: '#fff', display: 'grid', placeItems: 'center', border: '1px solid rgba(15,23,42,0.08)' }}>x</span>
            <span style={{ width: 34, height: 34, borderRadius: '9999px', background: '#fff', display: 'grid', placeItems: 'center', border: '1px solid rgba(15,23,42,0.08)' }}>ig</span>
          </div>
        </div>
      </footer>

      <InstallModal open={showIosModal} onClose={closeIosModal} />
    </main>
  );
}
