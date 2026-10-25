export type Project = {
  slug: string;
  name: string;
  // Omitted for admin-only apps: their address must never appear in this public repo.
  url?: string;
  kind: string;
  text: string;
  orgText?: string;
  stack: string[];
};

// Stacks were read from each repo's composer.lock and package.json on 2026-10-25.
export const projects: Project[] = [
  { slug: 'balanceview', name: 'BalanceView', url: 'https://www.balanceview.in', kind: 'Custom CMS', text: 'Company platform on a custom CMS: page builder, service catalogue, project showcase, settings-driven theming, PWA.', orgText: 'Company site on a custom CMS: page builder, service catalogue, project showcase, settings-driven theming, PWA.', stack: ['Laravel 13', 'Filament 5', 'Inertia 3', 'Vue 3'] },
  { slug: 'panchal', name: 'Panchal Interior', url: 'https://www.panchalinterior.in', kind: 'Contractor', text: 'ISO 9001 certified civil contractor: waterproofing, industrial fabrication, ACP glazing and interiors.', stack: ['Laravel 12', 'Filament 5', 'Inertia 2', 'React 19'] },
  { slug: 'mahalifepaths', name: 'Maha Life Paths', url: 'https://mahalifepaths.in', kind: 'Consultancy', text: 'Vedic astrology, numerology and vastu consultancy with service and enquiry flows.', stack: ['Laravel 12', 'Filament 5', 'Inertia 2', 'React 19'] },
  { slug: 'margdestination', name: 'Marg Destination', url: 'https://margdestination.com', kind: 'Travel', text: 'Travel and tour operator with enquiry and booking flows.', stack: ['Laravel 12', 'Filament 5', 'Inertia 2', 'React 19'] },
  { slug: 'wages', name: 'Wages App', kind: 'Payroll, admin only', text: 'Payroll and wage management with role-based permissions, activity logging and reporting dashboards.', stack: ['Laravel 13', 'Filament 5', 'Inertia 2', 'React 19'] },
  { slug: 'superfast', name: 'SuperFast Roadways', url: 'https://superfast.balanceview.in', kind: 'Logistics', text: 'Freight company site and operations app with Excel exports, rebuilt from a legacy Laravel 5.7 + Vue 2 codebase.', stack: ['Laravel 12', 'Filament 5', 'Livewire'] },
  { slug: 'uniquepalace', name: 'Unique Palace', url: 'https://uniquepalace.balanceview.in', kind: 'Gift shop', text: 'Gift store for birthdays, anniversaries and festivals, with a back office: menu builder, roles, activity log and scheduled backups.', stack: ['Laravel 13', 'Filament 5', 'Inertia 3', 'React 19'] },
  { slug: 'grocery', name: 'Grocery Store', url: 'https://grocerystore.balanceview.in', kind: 'E-commerce', text: 'Online store and back office with role-based permissions and analytics charts.', stack: ['Laravel 12', 'Filament 5', 'Inertia 2', 'React 19'] },
  { slug: 'hdstudio', name: 'HD Studio', url: 'https://hdstudio.co.in', kind: 'Static site', text: 'Drone photography, videography and survey studio in Ahmedabad.', stack: ['Astro 7', 'TypeScript', 'Tailwind 4', 'GSAP'] },
  { slug: 'radiocode', name: 'Radio Code', url: 'https://radiocodess.com', kind: 'Platform', text: 'Car radio unlock-code platform: public site, admin back office, API and several connected apps.', stack: ['Laravel', 'Blade', 'Vue', 'MySQL'] },
  { slug: 'margmigration', name: 'Marg Migration', url: 'https://margmigration.com', kind: 'WordPress', text: 'Immigration consultancy covering six countries and several visa categories.', stack: ['WordPress', 'Custom theme'] },
  { slug: 'scarlett', name: 'Scarlett Planners', url: 'https://scarlettplanners.com', kind: 'WordPress', text: 'Event planning studio site.', stack: ['WordPress', 'Elementor', 'Custom theme'] },
  { slug: 'vizdesign', name: 'Viz Design Solutions', url: 'https://vizdesign.balanceview.in', kind: 'Static PHP', text: 'Interior design studio site, Ahmedabad.', stack: ['PHP', 'Bootstrap'] },
];

// [simple-icons slug, label]; a slug simple-icons lacks renders as a text badge with the label.
export type Logo = [string, string];
export type Tile = { icon: string; title: string; text: string; logos: Logo[] };

export const personalBuild: Tile[] = [
  { icon: 'window', title: 'Web applications', text: 'Laravel 12 and 13 with Inertia, React 19 or Vue 3. Custom CMS builds and PWAs.', logos: [['laravel', 'Laravel'], ['react', 'React'], ['vuedotjs', 'Vue'], ['inertia', 'Inertia']] },
  { icon: 'panel', title: 'Filament admin panels', text: 'Role-based access, media libraries, settings, activity logs, backups, charts and Excel exports.', logos: [['filament', 'Filament'], ['livewire', 'Livewire']] },
  { icon: 'code', title: 'Backend and APIs', text: 'REST APIs, Sanctum auth, queues and jobs, caching, schema and query tuning.', logos: [['laravel', 'Laravel'], ['mysql', 'MySQL'], ['redis', 'Redis']] },
  { icon: 'bag', title: 'E-commerce', text: 'Storefronts with role-based back offices and analytics.', logos: [['laravel', 'Laravel'], ['woocommerce', 'WooCommerce']] },
  { icon: 'doc', title: 'WordPress', text: 'Custom themes and plugin work, WooCommerce and Elementor sites.', logos: [['wordpress', 'WordPress'], ['elementor', 'Elementor'], ['woocommerce', 'WooCommerce']] },
  { icon: 'check', title: 'Testing and delivery', text: 'Pest, Playwright smoke tests, Larastan, Pint and CI-gated deploys on GitHub Actions.', logos: [['githubactions', 'GitHub Actions'], ['docker', 'Docker'], ['git', 'Git']] },
];

// Wording from balanceview.in/it-services.
export const orgServices: Tile[] = [
  { icon: 'window', title: 'Web development', text: 'Websites, web apps, online stores and SaaS products in Laravel, Vue and React, plus upgrades for older PHP apps.', logos: [['laravel', 'Laravel'], ['vuedotjs', 'Vue'], ['react', 'React']] },
  { icon: 'code', title: 'Backend and APIs', text: 'REST and GraphQL APIs in Laravel and Node.js, and database tuning for systems that have slowed down.', logos: [['laravel', 'Laravel'], ['nodedotjs', 'Node.js'], ['mysql', 'MySQL']] },
  { icon: 'phone', title: 'Mobile apps', text: 'iOS and Android apps in React Native or Flutter, released to the App Store and Google Play.', logos: [['react', 'React Native'], ['flutter', 'Flutter']] },
  { icon: 'doc', title: 'CMS and WordPress', text: 'Custom WordPress themes and plugins, and headless CMS setups your team can edit.', logos: [['wordpress', 'WordPress'], ['elementor', 'Elementor']] },
  { icon: 'cloud', title: 'Cloud and integrations', text: 'AWS hosting, payment gateway integration, and CI/CD pipelines that test and deploy your code.', logos: [['aws', 'AWS'], ['githubactions', 'GitHub Actions'], ['docker', 'Docker']] },
  { icon: 'shield', title: 'Cybersecurity', text: 'Security audits, penetration tests, secure code reviews, incident response, ISO 27001, SOC 2 and PCI DSS prep.', logos: [['iso', 'ISO 27001'], ['soc2', 'SOC 2']] },
  { icon: 'monitor', title: 'Desktop software', text: 'Windows software for billing, inventory and back office work, with offline working and cloud sync.', logos: [['win', 'Windows']] },
];

// `icon` is the line icon used when simple-icons has no mark for the tool.
export const shipSteps: Array<{ name: string; note: string; logo: string; icon: string }> = [
  { name: 'git push', note: 'branch + PR', logo: 'git', icon: 'code' },
  { name: 'Pint', note: 'code style', logo: 'pint', icon: 'brush' },
  { name: 'Larastan', note: 'static analysis', logo: 'larastan', icon: 'search' },
  { name: 'Pest', note: 'tests', logo: 'pest', icon: 'flask' },
  { name: 'Playwright', note: 'real browser', logo: 'playwright', icon: 'window' },
  { name: 'Deploy', note: 'after green CI', logo: 'githubactions', icon: 'cloud' },
  { name: 'Live check', note: 'pages + headers', logo: 'hostinger', icon: 'check' },
];

export const toolkit: Array<{ group: string; items: Logo[] }> = [
  { group: 'Backend', items: [['php', 'PHP'], ['laravel', 'Laravel'], ['filament', 'Filament'], ['livewire', 'Livewire'], ['mysql', 'MySQL'], ['redis', 'Redis'], ['composer', 'Composer']] },
  { group: 'Frontend', items: [['typescript', 'TypeScript'], ['react', 'React'], ['vuedotjs', 'Vue'], ['inertia', 'Inertia'], ['tailwindcss', 'Tailwind'], ['vite', 'Vite'], ['astro', 'Astro']] },
  { group: 'Testing, delivery', items: [['pest', 'Pest'], ['playwright', 'Playwright'], ['larastan', 'Larastan'], ['githubactions', 'Actions'], ['docker', 'Docker'], ['git', 'Git'], ['cloudflare', 'Cloudflare']] },
  { group: 'CMS', items: [['wordpress', 'WordPress'], ['woocommerce', 'WooCommerce'], ['elementor', 'Elementor'], ['bootstrap', 'Bootstrap'], ['hostinger', 'Hostinger']] },
];

export const contact = {
  personal: {
    email: 'vedprakash12.vd@gmail.com',
    phone: '+91 82006 82062',
    whatsapp: 'https://wa.me/918200682062',
    site: 'https://www.balanceview.in/it-services',
  },
  org: {
    email: 'itsolutions@balanceview.in',
    phone: '+91 82006 82062',
    whatsapp: 'https://wa.me/918200682062',
    site: 'https://www.balanceview.in/it-services',
  },
};

// Shown as full cards, in this order; every other project goes in the compact "More work" card.
export const featured = ['balanceview', 'panchal', 'superfast', 'hdstudio', 'grocery', 'radiocode'];
