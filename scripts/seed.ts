/**
 * DevManager Pro — Seed Script
 * Run: npx ts-node --project tsconfig.json scripts/seed.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { addDays, subDays, subMonths, startOfMonth } from 'date-fns';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devmanager';
const AES_KEY = Buffer.from(process.env.AES_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'utf8');

// ─── Encryption helper ────────────────────────────────────────────────────────
function encryptCredential(plaintext: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  let ct = cipher.update(plaintext, 'utf8', 'base64');
  ct += cipher.final('base64');
  return { passwordEnc: ct, iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64') };
}

// ─── Schema imports (inline to avoid Next.js module issues) ───────────────────
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, passwordHash: String,
  role: { type: String, default: 'admin' }, twoFactorEnabled: { type: Boolean, default: false },
  businessName: String, businessAddress: String, defaultCurrency: { type: String, default: 'USD' },
  defaultTaxRate: { type: Number, default: 0 }, timezone: { type: String, default: 'UTC' },
  notificationPrefs: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const ClientSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, name: String, email: String, company: String,
  phone: String, status: { type: String, default: 'active' }, tags: [String],
  portalToken: { type: String, unique: true }, notes: String,
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, clientId: mongoose.Schema.Types.ObjectId,
  title: String, description: String,
  status: { type: String, default: 'active' }, type: { type: String, default: 'one_time' },
  startDate: Date, deadline: Date, liveUrl: String, stagingUrl: String,
  techStack: [String], onboardingDone: [String], notes: String,
  color: String, isArchived: { type: Boolean, default: false },
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, projectId: mongoose.Schema.Types.ObjectId,
  title: String, description: String, status: { type: String, default: 'todo' },
  priority: String, order: Number,
}, { timestamps: true });

const TimeLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, projectId: mongoose.Schema.Types.ObjectId,
  date: Date, hours: Number, description: String, billable: Boolean, billed: Boolean,
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, clientId: mongoose.Schema.Types.ObjectId,
  projectId: mongoose.Schema.Types.ObjectId, type: String,
  amount: Number, currency: { type: String, default: 'USD' },
  status: { type: String, default: 'unpaid' }, dueDate: Date, paidDate: Date,
  description: String, isRecurring: { type: Boolean, default: false },
  nextDueDate: Date, reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

const InvoiceSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, clientId: mongoose.Schema.Types.ObjectId,
  projectId: mongoose.Schema.Types.ObjectId, invoiceNumber: { type: String, unique: true },
  issueDate: Date, dueDate: Date,
  status: { type: String, default: 'draft' },
  lineItems: [{ description: String, quantity: Number, unitPrice: Number, total: Number }],
  subtotal: Number, taxRate: Number, taxAmount: Number, discount: Number,
  total: Number, currency: { type: String, default: 'USD' }, notes: String,
}, { timestamps: true });

const TechAssetSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId, userId: mongoose.Schema.Types.ObjectId,
  hosting: { provider: String, loginUrl: String, username: String, plan: String,
    expiryDate: Date, cost: Number, currency: String, reminderDays: Number, notes: String },
  domain: { registrar: String, domainName: String, expiryDate: Date,
    autoRenewal: Boolean, cost: Number, reminderDays: Number, notes: String },
  ssl: { provider: String, issuedDate: Date, expiryDate: Date, reminderDays: Number, notes: String },
  database: { type: String, host: String, port: String, dbName: String, backupSchedule: String },
  github: { repoUrl: String, deployBranch: String, accessStatus: String, isPrivate: Boolean },
}, { timestamps: true });

const CredentialSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId, userId: mongoose.Schema.Types.ObjectId,
  label: String, type: String, username: String,
  passwordEnc: String, iv: String, authTag: String,
  url: String, notes: String,
}, { timestamps: true });

const ActivityLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, projectId: mongoose.Schema.Types.ObjectId,
  action: String, description: String, ipAddress: String,
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, type: String,
  title: String, message: String, relatedId: mongoose.Schema.Types.ObjectId,
  relatedType: String, isRead: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

// ─── Models ───────────────────────────────────────────────────────────────────
const User       = mongoose.model('User',        UserSchema);
const Client     = mongoose.model('Client',      ClientSchema);
const Project    = mongoose.model('Project',     ProjectSchema);
const Task       = mongoose.model('Task',        TaskSchema);
const TimeLog    = mongoose.model('TimeLog',     TimeLogSchema);
const Payment    = mongoose.model('Payment',     PaymentSchema);
const Invoice    = mongoose.model('Invoice',     InvoiceSchema);
const TechAsset  = mongoose.model('TechAsset',   TechAssetSchema);
const Credential = mongoose.model('Credential',  CredentialSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// ─── Data ─────────────────────────────────────────────────────────────────────
const CLIENTS_DATA = [
  { name: 'Sarah Johnson',  company: 'TechNova Solutions',  email: 'sarah@technova.io',    phone: '+1-415-555-0101', tags: ['saas', 'enterprise'], status: 'active' },
  { name: 'Marcus Chen',    company: 'GreenLeaf Commerce',  email: 'marcus@greenleaf.com', phone: '+1-312-555-0202', tags: ['ecommerce', 'retail'], status: 'active' },
  { name: 'Priya Sharma',   company: 'MediTrack Health',    email: 'priya@meditrack.co',   phone: '+1-212-555-0303', tags: ['healthtech', 'b2b'],   status: 'active' },
  { name: 'Daniel Torres',  company: 'UrbanEstate Realty',  email: 'daniel@urbanestate.co',phone: '+1-305-555-0404', tags: ['real-estate'],          status: 'inactive' },
  { name: 'Emma Whitfield', company: 'PixelForge Creative', email: 'emma@pixelforge.io',   phone: '+44-20-555-0505', tags: ['agency', 'design'],    status: 'active' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316'];

const TECH_STACKS = [
  ['Next.js', 'TypeScript', 'MongoDB', 'TailwindCSS'],
  ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
  ['Vue.js', 'Laravel', 'MySQL', 'AWS'],
  ['Next.js', 'Prisma', 'PostgreSQL', 'Vercel'],
  ['React Native', 'Expo', 'Firebase', 'Redux'],
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Clean existing demo data
  console.log('🧹 Cleaning existing seed data...');
  const existingUser = await User.findOne({ email: 'demo@devmanager.pro' });
  if (existingUser) {
    const uid = existingUser._id;
    await Promise.all([
      Client.deleteMany({ userId: uid }),
      Project.deleteMany({ userId: uid }),
      Task.deleteMany({ userId: uid }),
      TimeLog.deleteMany({ userId: uid }),
      Payment.deleteMany({ userId: uid }),
      Invoice.deleteMany({ userId: uid }),
      TechAsset.deleteMany({ userId: uid }),
      Credential.deleteMany({ userId: uid }),
      ActivityLog.deleteMany({ userId: uid }),
      Notification.deleteMany({ userId: uid }),
      User.deleteOne({ _id: uid }),
    ]);
  }

  // ── 1. Admin User ──────────────────────────────────────────────────────────
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const user = await User.create({
    name: 'Alex Dev',
    email: 'demo@devmanager.pro',
    passwordHash,
    role: 'admin',
    businessName: 'Alex Dev Studio',
    businessAddress: '123 Dev Lane, San Francisco, CA 94105',
    defaultCurrency: 'USD',
    defaultTaxRate: 10,
    timezone: 'America/Los_Angeles',
    notificationPrefs: {
      emailAlertsEnabled: true, hostingExpiryDays: 30, domainExpiryDays: 30,
      sslExpiryDays: 14, paymentOverdueEnabled: true, subscriptionDueDays: 3,
    },
  });
  const userId = user._id;
  console.log(`   ✅ User: demo@devmanager.pro / Demo1234!`);

  // ── 2. Clients ─────────────────────────────────────────────────────────────
  console.log('👥 Creating clients...');
  const clients = await Promise.all(
    CLIENTS_DATA.map((c) =>
      Client.create({
        ...c,
        userId,
        portalToken: crypto.randomBytes(32).toString('hex'),
        notes: `Long-term client. ${c.tags.join(', ')} industry.`,
      })
    )
  );
  console.log(`   ✅ ${clients.length} clients`);

  // ── 3. Projects ────────────────────────────────────────────────────────────
  console.log('📁 Creating projects...');
  const projectsData = [
    { title: 'TechNova SaaS Dashboard', clientIdx: 0, status: 'active',        type: 'retainer',             color: COLORS[0], daysUntilDeadline: 45 },
    { title: 'GreenLeaf E-commerce',    clientIdx: 1, status: 'active',        type: 'one_time',             color: COLORS[1], daysUntilDeadline: 8  },
    { title: 'MediTrack Patient Portal',clientIdx: 2, status: 'active',        type: 'one_time',             color: COLORS[2], daysUntilDeadline: 30 },
    { title: 'UrbanEstate Mobile App',  clientIdx: 3, status: 'maintenance',   type: 'monthly_maintenance',  color: COLORS[3], daysUntilDeadline: 90 },
    { title: 'PixelForge Brand Site',   clientIdx: 4, status: 'maintenance',   type: 'monthly_maintenance',  color: COLORS[4], daysUntilDeadline: 60 },
    { title: 'TechNova API Integration',clientIdx: 0, status: 'completed',     type: 'one_time',             color: COLORS[5], daysUntilDeadline: -10 },
    { title: 'GreenLeaf Analytics',     clientIdx: 1, status: 'pending_payment',type: 'one_time',            color: COLORS[6], daysUntilDeadline: -5  },
    { title: 'MediTrack Telemedicine',  clientIdx: 2, status: 'paused',        type: 'one_time',             color: COLORS[7], daysUntilDeadline: 120 },
  ];

  const projects = await Promise.all(
    projectsData.map((p, i) =>
      Project.create({
        userId, clientId: clients[p.clientIdx]._id,
        title: p.title, status: p.status, type: p.type, color: p.color,
        description: `${p.title} — Full-stack development and ongoing maintenance.`,
        startDate: subMonths(new Date(), 3),
        deadline: addDays(new Date(), p.daysUntilDeadline),
        liveUrl: `https://${p.title.toLowerCase().replace(/\s+/g, '-')}.vercel.app`,
        stagingUrl: `https://staging-${p.title.toLowerCase().replace(/\s+/g, '-')}.vercel.app`,
        techStack: TECH_STACKS[i % TECH_STACKS.length],
        onboardingDone: ['domain_configured', 'repo_created', 'staging_ready'],
        notes: 'Client approved initial wireframes. Development in progress.',
      })
    )
  );
  console.log(`   ✅ ${projects.length} projects`);

  // ── 4. Tasks ───────────────────────────────────────────────────────────────
  console.log('✅ Creating tasks...');
  const taskTemplates = [
    [{ title: 'Design system setup',      status: 'done',        priority: 'high' },
     { title: 'Auth module',              status: 'done',        priority: 'high' },
     { title: 'Dashboard UI',             status: 'in_progress', priority: 'high' },
     { title: 'API integration',          status: 'in_progress', priority: 'medium' },
     { title: 'Mobile responsiveness',    status: 'todo',        priority: 'medium' }],
    [{ title: 'Product catalogue',        status: 'done',        priority: 'high' },
     { title: 'Shopping cart',            status: 'in_progress', priority: 'high' },
     { title: 'Payment gateway',          status: 'todo',        priority: 'high' },
     { title: 'Order management',         status: 'todo',        priority: 'medium' }],
    [{ title: 'Patient registration',     status: 'done',        priority: 'high' },
     { title: 'Appointment booking',      status: 'in_progress', priority: 'high' },
     { title: 'Medical records view',     status: 'todo',        priority: 'medium' }],
  ];

  let totalTasks = 0;
  for (let i = 0; i < projects.length; i++) {
    const templates = taskTemplates[i % taskTemplates.length];
    await Promise.all(
      templates.map((t, order) =>
        Task.create({ userId, projectId: projects[i]._id, ...t, order })
      )
    );
    totalTasks += templates.length;
  }
  console.log(`   ✅ ${totalTasks} tasks`);

  // ── 5. Time Logs ──────────────────────────────────────────────────────────
  console.log('⏱  Creating time logs...');
  let totalLogs = 0;
  const logDescriptions = [
    'Initial setup and configuration', 'API endpoint development', 'UI component implementation',
    'Database schema design', 'Bug fixes and testing', 'Client feedback revisions',
    'Performance optimization', 'Code review and refactoring', 'Documentation update', 'Deployment and DevOps',
  ];
  for (const project of projects.slice(0, 5)) {
    for (let d = 0; d < 14; d++) {
      await TimeLog.create({
        userId, projectId: project._id,
        date: subDays(new Date(), d),
        hours: +(Math.random() * 4 + 1).toFixed(1),
        description: logDescriptions[Math.floor(Math.random() * logDescriptions.length)],
        billable: Math.random() > 0.2,
        billed: Math.random() > 0.5,
      });
      totalLogs++;
    }
  }
  console.log(`   ✅ ${totalLogs} time log entries`);

  // ── 6. Tech Assets (with expiry dates) ────────────────────────────────────
  console.log('🖥  Creating tech assets...');
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const isCritical = i === 0; // 5 days — triggers critical alert
    const isWarning  = i === 1; // 20 days — triggers warning alert
    await TechAsset.create({
      userId, projectId: p._id,
      hosting: {
        provider: ['SiteGround', 'Cloudways', 'DigitalOcean', 'Vercel', 'AWS'][i % 5],
        loginUrl: 'https://my.siteground.com',
        username: `admin_${i}`,
        plan: ['GrowBig', 'Business', 'Droplet 2GB', 'Pro', 'EC2 t3.small'][i % 5],
        expiryDate: isCritical ? addDays(new Date(), 5) : addDays(new Date(), 60 + i * 30),
        cost: [15.99, 34.99, 18, 0, 45][i % 5],
        currency: 'USD',
        reminderDays: 30,
      },
      domain: {
        registrar: ['Namecheap', 'GoDaddy', 'Cloudflare', 'Google Domains', 'Name.com'][i % 5],
        domainName: `${p.title.toLowerCase().replace(/\s+/g, '-')}.com`,
        expiryDate: isWarning ? addDays(new Date(), 20) : addDays(new Date(), 180 + i * 45),
        autoRenewal: i % 2 === 0,
        cost: 12.99,
        reminderDays: 30,
      },
      ssl: {
        provider: "Let's Encrypt",
        issuedDate: subMonths(new Date(), 2),
        expiryDate: addDays(new Date(), 88 + i * 15),
        reminderDays: 14,
      },
      database: {
        type: ['mysql', 'pgsql', 'mongodb', 'pgsql', 'mongodb'][i % 5],
        host: 'db.internal',
        port: ['3306', '5432', '27017', '5432', '27017'][i % 5],
        dbName: p.title.toLowerCase().replace(/\s+/g, '_'),
        backupSchedule: 'Daily at 2:00 AM UTC',
      },
      github: {
        repoUrl: `https://github.com/alexdev/${p.title.toLowerCase().replace(/\s+/g, '-')}`,
        deployBranch: 'main',
        accessStatus: 'owner',
        isPrivate: true,
      },
    });
  }
  console.log(`   ✅ ${projects.length} tech assets (1 critical expiry, 1 warning expiry)`);

  // ── 7. Credentials ────────────────────────────────────────────────────────
  console.log('🔑 Creating credentials...');
  const credTypes = [
    { label: 'FTP Access', type: 'ftp', username: 'ftpuser', password: 'FTP@SecureP@ss123', url: 'ftp://ftp.server.com' },
    { label: 'cPanel Login', type: 'cpanel', username: 'cpanel_admin', password: 'cPanel$tr0ngP@ss!', url: 'https://server.com:2083' },
    { label: 'DB Root', type: 'database', username: 'root', password: 'DB#R00t$ecure456', url: '' },
    { label: 'Stripe API Key', type: 'api_key', username: '', password: 'sk_live_51OexampleKeyHere000000', url: 'https://dashboard.stripe.com' },
  ];
  for (const project of projects.slice(0, 4)) {
    const cred = credTypes[projects.indexOf(project) % credTypes.length];
    const enc = encryptCredential(cred.password);
    await Credential.create({
      userId, projectId: project._id,
      label: cred.label, type: cred.type, username: cred.username,
      ...enc, url: cred.url, notes: 'Keep confidential.',
    });
  }
  console.log('   ✅ 4 credentials');

  // ── 8. Payments ───────────────────────────────────────────────────────────
  console.log('💳 Creating payments...');
  const paymentData = [
    // Paid payments (last 6 months)
    ...Array.from({ length: 12 }, (_, i) => ({
      clientIdx: i % 5, projectIdx: i % 8, status: 'paid' as const,
      amount: [2500, 4800, 1200, 3600, 8000, 1800, 5200, 950, 3100, 6700, 2200, 4400][i],
      description: `Monthly retainer — ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} 2025`,
      daysOffset: -(i * 25 + 5), paidOffset: -(i * 25 + 2),
    })),
    // Unpaid
    { clientIdx: 0, projectIdx: 0, status: 'unpaid' as const, amount: 3200, description: 'Phase 2 milestone', daysOffset: 14, paidOffset: 0 },
    { clientIdx: 1, projectIdx: 1, status: 'unpaid' as const, amount: 5500, description: 'E-commerce deployment', daysOffset: 21, paidOffset: 0 },
    { clientIdx: 2, projectIdx: 2, status: 'unpaid' as const, amount: 2800, description: 'Portal development', daysOffset: 7, paidOffset: 0 },
    // Overdue
    { clientIdx: 3, projectIdx: 3, status: 'overdue' as const, amount: 1800, description: 'Maintenance Q3', daysOffset: -10, paidOffset: 0 },
    { clientIdx: 4, projectIdx: 4, status: 'overdue' as const, amount: 2200, description: 'Brand redesign balance', daysOffset: -15, paidOffset: 0 },
    // Recurring subscription
    { clientIdx: 0, projectIdx: 0, status: 'unpaid' as const, amount: 800, description: 'Monthly hosting support', daysOffset: 30, paidOffset: 0, isRecurring: true },
    { clientIdx: 2, projectIdx: 2, status: 'unpaid' as const, amount: 500, description: 'Monthly maintenance', daysOffset: 30, paidOffset: 0, isRecurring: true },
  ];

  await Promise.all(
    paymentData.map((p) =>
      Payment.create({
        userId,
        clientId: clients[p.clientIdx]._id,
        projectId: projects[Math.min(p.projectIdx, projects.length - 1)]._id,
        type: (p as any).isRecurring ? 'subscription' : 'one_time',
        amount: p.amount, currency: 'USD', status: p.status,
        dueDate: addDays(new Date(), p.daysOffset),
        paidDate: p.paidOffset < 0 ? addDays(new Date(), p.paidOffset) : p.status === 'paid' ? addDays(new Date(), p.daysOffset - 2) : undefined,
        description: p.description,
        isRecurring: !!(p as any).isRecurring,
        nextDueDate: (p as any).isRecurring ? addDays(new Date(), 30) : undefined,
        reminderSent: p.status === 'overdue',
      })
    )
  );
  console.log(`   ✅ ${paymentData.length} payments`);

  // ── 9. Invoices ───────────────────────────────────────────────────────────
  console.log('📄 Creating invoices...');
  const invoicesData = [
    { status: 'paid',  clientIdx: 0, projectIdx: 0, number: 'INV-2025-001', total: 5000, paidMonthsAgo: 2 },
    { status: 'sent',  clientIdx: 1, projectIdx: 1, number: 'INV-2025-002', total: 8500, dueDays: 14 },
    { status: 'draft', clientIdx: 2, projectIdx: 2, number: 'INV-2025-003', total: 3200, dueDays: 30 },
  ];
  await Promise.all(
    invoicesData.map((inv) =>
      Invoice.create({
        userId,
        clientId: clients[inv.clientIdx]._id,
        projectId: projects[Math.min(inv.projectIdx, projects.length - 1)]._id,
        invoiceNumber: inv.number,
        issueDate: inv.paidMonthsAgo ? subMonths(new Date(), inv.paidMonthsAgo) : new Date(),
        dueDate: inv.paidMonthsAgo ? subMonths(new Date(), inv.paidMonthsAgo - 0.5) : addDays(new Date(), inv.dueDays || 30),
        status: inv.status,
        lineItems: [
          { description: 'Web Development Services', quantity: 1, unitPrice: inv.total * 0.9, total: inv.total * 0.9 },
          { description: 'Project Management', quantity: 1, unitPrice: inv.total * 0.1, total: inv.total * 0.1 },
        ],
        subtotal: inv.total,
        taxRate: 10, taxAmount: inv.total * 0.1, discount: 0,
        total: inv.total * 1.1, currency: 'USD',
        notes: 'Payment due within 30 days. Thank you for your business!',
        paidAt: inv.paidMonthsAgo ? subMonths(new Date(), inv.paidMonthsAgo - 0.3) : undefined,
        sentAt: inv.status !== 'draft' ? new Date() : undefined,
      })
    )
  );
  console.log('   ✅ 3 invoices');

  // ── 10. Activity Logs (30 days) ────────────────────────────────────────────
  console.log('📋 Creating activity logs...');
  const activityData = [
    { action: 'CREATE_PROJECT', description: 'Created project: TechNova SaaS Dashboard' },
    { action: 'CREATE_CLIENT',  description: 'Added new client: TechNova Solutions' },
    { action: 'UPDATE_PROJECT', description: 'Updated project status to active' },
    { action: 'LOG_TIME',       description: 'Logged 3.5 hours on TechNova SaaS Dashboard' },
    { action: 'CREATE_INVOICE', description: 'Created invoice INV-2025-001 for $5,000' },
    { action: 'UPDATE_PAYMENT', description: 'Marked payment as paid: $2,500' },
    { action: 'REVEAL_CREDENTIAL', description: 'Revealed password for credential: FTP Access' },
    { action: 'CREATE_TASK',    description: 'Created task: Dashboard UI' },
    { action: 'UPDATE_TASK',    description: 'Task moved to in_progress: API integration' },
    { action: 'UPDATE_PROFILE', description: 'Profile updated: businessName, timezone' },
  ];
  await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      ActivityLog.create({
        userId,
        projectId: projects[i % projects.length]._id,
        ...activityData[i % activityData.length],
        ipAddress: '127.0.0.1',
        createdAt: subDays(new Date(), i),
      })
    )
  );
  console.log('   ✅ 30 activity log entries');

  // ── 11. Notifications (5 unread) ──────────────────────────────────────────
  console.log('🔔 Creating notifications...');
  await Promise.all([
    Notification.create({
      userId, type: 'hosting_expiry',
      title: 'Hosting Expiry Alert',
      message: 'Hosting for TechNova SaaS Dashboard expires in 5 days (SiteGround).',
      relatedId: projects[0]._id, relatedType: 'project', isRead: false,
    }),
    Notification.create({
      userId, type: 'domain_expiry',
      title: 'Domain Expiry Alert',
      message: 'Domain "greenlef-e-commerce.com" expires in 20 days.',
      relatedId: projects[1]._id, relatedType: 'project', isRead: false,
    }),
    Notification.create({
      userId, type: 'payment_overdue',
      title: 'Payment Overdue',
      message: 'Payment of USD 1,800 from UrbanEstate Realty is overdue.',
      relatedId: projects[3]._id, relatedType: 'payment', isRead: false,
    }),
    Notification.create({
      userId, type: 'payment_overdue',
      title: 'Payment Overdue',
      message: 'Payment of USD 2,200 from PixelForge Creative is overdue.',
      relatedId: projects[4]._id, relatedType: 'payment', isRead: false,
    }),
    Notification.create({
      userId, type: 'invoice_sent',
      title: 'Invoice Sent',
      message: 'Invoice INV-2025-002 for $8,500 was sent to GreenLeaf Commerce.',
      relatedId: projects[1]._id, relatedType: 'invoice', isRead: false,
    }),
  ]);
  console.log('   ✅ 5 unread notifications');

  // ── 12. MongoDB Indexes ────────────────────────────────────────────────────
  console.log('📊 Creating indexes...');
  const db = mongoose.connection.db!;
  await Promise.allSettled([
    db.collection('clients').createIndex({ userId: 1, status: 1 }),
    db.collection('projects').createIndex({ userId: 1, status: 1 }),
    db.collection('projects').createIndex({ clientId: 1 }),
    db.collection('payments').createIndex({ userId: 1, status: 1, dueDate: 1 }),
    db.collection('notifications').createIndex({ userId: 1, isRead: 1, createdAt: -1 }),
    db.collection('activitylogs').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('techassets').createIndex({ projectId: 1 }),
    db.collection('credentials').createIndex({ projectId: 1 }),
  ]);
  console.log('   ✅ Indexes created');

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete!');
  console.log('   Login: demo@devmanager.pro');
  console.log('   Password: Demo1234!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
