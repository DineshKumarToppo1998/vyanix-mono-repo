# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vyanix is a React-based e-commerce storefront built with Next.js 15 and TypeScript. It features a modern UI using Radix UI components and Tailwind CSS, with a fully functional shopping cart using localStorage persistence.

## Tech Stack

- **Framework**: Next.js 15.5.9 with App Router
- **Language**: TypeScript 5
- **UI Library**: Custom components built on Radix UI primitives
- **Styling**: Tailwind CSS 3.4.1 with custom configuration
- **State Management**: React context/hooks (use-cart hook)
- **Form Handling**: React Hook Form with Zod validation
- **Themes**: next-themes for dark/light mode
- **Icons**: Lucide React
- **Firebase**: Integrated for backend services

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 9002 with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Project Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with ThemeProvider, Toaster
│   ├── page.tsx           # Homepage
│   ├── products/[id]/     # Product detail page
│   ├── checkout/page.tsx  # Multi-step checkout flow
│   └── globals.css        # Global styles & Tailwind imports
├── components/
│   ├── ui/                # Radix-based UI components (button, card, dialog, etc.)
│   ├── layout/            # Header, Footer
│   ├── cart/              # CartDrawer component
│   ├── product/           # ProductCard component
│   └── theme-provider.tsx # ThemeProvider wrapper
├── hooks/
│   ├── use-cart.ts        # Shopping cart state management
│   └── use-toast.ts       # Toast notification hook
└── lib/
    ├── types.ts           # TypeScript interfaces (Product, CartItem, etc.)
    ├── mock-data.ts       # Product and category data
    └── utils.ts           # Utility functions (cn helper)
```

### Key Patterns

1. **UI Components**: All UI components are in `src/components/ui/` and built on Radix UI primitives with Tailwind styling
2. **Shared Utilities**: Common utilities like `cn()` for class merging are in `src/lib/utils.ts`
3. **Cart State**: Managed via `useCart` hook with localStorage persistence under key `commercehub-cart`
4. **Type Safety**: Full TypeScript with strict mode enabled
5. **Path Aliases**: `@/*` maps to `./src/*` for imports

### State Management

- **Cart**: localStorage-based in `useCart` hook (no Redux/Zustand)
- **Theme**: next-themes provider
- **Toast**: React Hook Form's toast system

### Routing

- Homepage: `/`
- Product detail: `/products/[id]`
- Checkout: `/checkout` (multi-step)
- Order confirmation: `/order-confirmation`
- Categories: `/category/:slug`
