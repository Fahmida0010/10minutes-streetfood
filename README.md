# 🍜 10Minites Streetfood

### Discover the Best Food Spots Within a 10-Minute Walk!

[![Live Website](https://img.shields.io/badge/Live-Website-brightgreen?style=for-the-badge)](https://10minites-streetfood.app)

**10Minites Streetfood** is a location-based food discovery platform that helps people find nearby restaurants, street food stalls, and hidden food spots within a 10-minute walking distance.

Whether you're a local resident or a traveler exploring a new city, discover great food around you without wasting time searching.

The platform focuses on location-based discovery, walking distance, interactive maps, and a user-friendly bilingual experience.

🌐 **Live Demo:** https://10minites-streetfood.app

---

## ✨ Key Features

- **📍 Location-Based Discovery:** Discover food places based on your current location.
- **🚶 10-Minute Walking Radius:** Find restaurants and street food spots reachable within approximately 10 minutes on foot.
- **🗺️ Interactive Map:** Explore nearby food locations using Leaflet and OpenStreetMap.
- **🧭 Walking Directions:** Get walking routes and estimated travel times using OSRM routing.
- **🍽️ Food & Restaurant Details:** Explore restaurant information, menus, deals, and reviews.
- **🌍 Bilingual Experience:** Switch between English and Bengali.
- **👤 Authentication:** Sign up and sign in to access user features.
- **💡 Suggest a Place:** Help the community discover hidden food spots.
- **📱 Progressive Web App:** Install the website on supported mobile devices.
- **📊 Visitor Tracking:** Track website visits and visitor activity.
- **📱 Responsive Design:** Optimized for desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

### Frontend
- React 19
- TypeScript 5.8
- Tailwind CSS v4
- Radix UI
- shadcn/ui-style components
- Lucide React
- Sonner
- Bricolage Grotesque & Hind Siliguri

### Framework & Data Management
- TanStack Start
- TanStack Router
- TanStack Query
- Vite 8
- React Hook Form
- Zod

### Maps & Location Services
- Leaflet 1.9
- OpenStreetMap
- OSRM Routing API

### Backend & Database
- Lovable Cloud
- PostgreSQL
- Authentication & Storage
- Row Level Security (RLS)
- SECURITY DEFINER Functions

### Testing & Code Quality
- Vitest 4
- Testing Library
- jsdom
- ESLint 9
- Prettier 3

### Deployment
- Cloudflare Workers (Edge Deployment)

## 🏗️ Application Architecture

The application uses TanStack Start as its full-stack framework, with PostgreSQL-powered backend services through Lovable Cloud.

**Main Routes:**

| Route | Description |
|---|---|
| `/` | Homepage and nearby food discovery |
| `/place/$id` | Individual restaurant details |
| `/dashboard` | Dashboard |
| `/auth` | Authentication |
| `/suggest` | Suggest a new food spot |

**Database Entities:**
- Restaurants
- Menu
- Deals
- Reviews
- Visitors

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js (LTS recommended)
- npm or another compatible package manager
- Git

### Installation

1. Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

2. Navigate to the project directory:

```bash
cd 10minites-streetfood
```

3. Install dependencies:

```bash
npm install
```

4. Configure your environment variables according to your backend configuration.

5. Start the development server:

```bash
npm run dev
```

6. Open the local development URL displayed in your terminal.

## 🌐 Maps & Routing

The platform uses:

- **OpenStreetMap** for map tiles.
- **Leaflet** for interactive map rendering.
- **OSRM** for walking routes and estimated travel times.

These technologies help users understand how to reach nearby food destinations on foot.

## 🔒 Security

- PostgreSQL Row Level Security (RLS) policies.
- Secure authentication.
- Protected database operations.
- Server-side functions for visitor tracking.
- Input validation using Zod.

## 🗺️ Project Vision

The vision behind 10Minites Streetfood is simple:

**Great food should never be far away.**

Starting with local food discovery in Sylhet, the long-term goal is to help people discover restaurants, street food, and hidden culinary destinations across different cities.

The platform aims to make exploring local food easier for residents, visitors, and international travelers.

## 🔮 Future Improvements

- Expand food discovery to more cities across Bangladesh.
- Improve location accuracy and walking-distance calculations.
- Introduce personalized food recommendations.
- Add advanced search and filtering.
- Enable restaurant owners to manage their listings.
- Improve community reviews and food recommendations.
- Enhance location-based discovery and performance.


<p align="center">
  <strong>Made with ❤️ for food lovers and explorers.</strong>
  <br />
  <a href="https://10minites-streetfood.app">Explore 10Minites Streetfood</a>
</p>
