# Simba Super Market - Web Frontend

Next.js 15 App Router frontend with full i18n (EN/RW/SW/FR), dark/light mode, real-time updates.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:5000/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL (default: `http://localhost:5000`) |

## Pages

### Public
| Route | Description |
|---|---|
| `/[locale]` | Home - hero, featured, top products, recommendations, categories |
| `/[locale]/shop` | Shop - search, filters, pagination |
| `/[locale]/product/[slug]` | Product detail - big photo + 4 thumbnails, reviews, similar products |
| `/[locale]/cart` | Shopping cart |
| `/[locale]/checkout` | Checkout with DPO Pay or Cash on Delivery |
| `/[locale]/payment/success` | Payment success callback |
| `/[locale]/payment/cancel` | Payment cancel callback |
| `/[locale]/blog` | Blog list |
| `/[locale]/blog/[slug]` | Blog post with TipTap content, likes, comments |
| `/[locale]/contact` | Contact form |

### Authenticated
| Route | Description |
|---|---|
| `/[locale]/account/profile` | Profile edit |
| `/[locale]/account/orders` | Orders list |
| `/[locale]/account/orders/[id]` | Real-time order tracking |
| `/[locale]/auth/sign-in` | Sign in |
| `/[locale]/auth/sign-up` | Create account |
| `/[locale]/auth/forgot-password` | Password reset |

### Admin (roles: poster, admin, super_admin)
| Route | Description |
|---|---|
| `/[locale]/admin/dashboard` | Stats, revenue chart, recent orders |
| `/[locale]/admin/products` | Product CRUD with image URLs |
| `/[locale]/admin/orders` | Order management + real-time status updates |
| `/[locale]/admin/users` | User list + role management (super_admin only) |
| `/[locale]/admin/blogs` | Blog CRUD with TipTap editor |
| `/[locale]/admin/contacts` | Contact messages inbox |
| `/[locale]/admin/banners` | Banner management |
| `/[locale]/admin/settings` | Store settings (super_admin only) |

## Languages
- 🇬🇧 English (`/en/...`)
- 🇷🇼 Kinyarwanda (`/rw/...`)
- 🇹🇿 Kiswahili (`/sw/...`)
- 🇫🇷 Français (`/fr/...`)

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v3 - primary `#fc7d00`, dark/light via `next-themes`
- **i18n**: `next-intl` v4
- **State**: Zustand (cart, UI, wishlist)
- **Data fetching**: TanStack Query v5
- **Auth**: Better Auth (client)
- **Real-time**: Socket.io client
- **Rich text**: TipTap editor (admin blogs)
- **Charts**: Recharts (admin dashboard)
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

## Running with Backend

Make sure `simba-api` is running on port 5000:
```bash
# In simba-api directory
npm run dev
```

Then start the frontend:
```bash
# In simba-web directory  
npm run dev
```
