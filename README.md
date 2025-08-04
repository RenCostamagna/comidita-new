# 🍽️ Comidita - Food Discovery & Review Platform

Comidita is a modern web application that allows users to discover, review, and share their favorite restaurants and food places. Built with Next.js 15, Supabase, and Google Maps integration, it provides a comprehensive platform for food enthusiasts to connect and share their culinary experiences.

## ✨ Features

### 🔐 User Authentication
- Secure authentication powered by Supabase Auth
- Social login options
- User profiles with customizable information

### 📍 Place Discovery
- Google Maps integration for location-based search
- Category-based browsing (restaurants, cafes, bars, etc.)
- Advanced search and filtering options
- Price range filtering
- Top-rated places showcase

### ⭐ Review System
- Detailed reviews with ratings
- Photo uploads with automatic compression
- AI-powered text enhancement for reviews
- Review categories and tags
- Like and interaction system

### 🏆 Gamification
- User levels and experience points
- Achievement system with badges
- Points earned for reviews, photos, and engagement
- Progress tracking and showcases

### 📱 Mobile-First Design
- Responsive design optimized for mobile
- Bottom navigation for easy mobile access
- Touch-friendly interface
- Progressive Web App (PWA) capabilities

### 🔔 Real-time Notifications
- In-app notification system
- Achievement unlocked notifications
- Review interactions alerts

### 📸 Photo Management
- Multiple photo uploads per review
- Automatic image compression and optimization
- Photo galleries and modals
- Vercel Blob storage integration

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Vercel Blob Storage
- **Maps**: Google Maps API
- **AI**: OpenAI API for text enhancement
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Maps API key
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/comidita-app.git
   cd comidita-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   
   Create a \`.env.local\` file in the root directory:
   
   \`\`\`env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Google Maps (Server-side only for security)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # Vercel Blob Storage
   BLOB_READ_WRITE_TOKEN=your_blob_token
   
   # OpenAI (for text enhancement)
   OPENAI_API_KEY=your_openai_api_key
   \`\`\`

   **⚠️ Security Note**: The Google Maps API key is kept server-side only to prevent exposure and unauthorized usage. All Maps functionality is handled through secure API routes.

4. **Set up the database**
   
   Run the database setup script in your Supabase SQL editor:
   \`\`\`bash
   # The script is located at scripts/unified-database-setup.sql
   # Copy and paste the content into your Supabase SQL editor
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   
   Navigate to \`http://localhost:3000\`

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User profiles and authentication data
- **places**: Restaurant and food place information
- **reviews**: User reviews with ratings and content
- **photos**: Image storage references and metadata
- **achievements**: User achievement tracking
- **notifications**: In-app notification system
- **user_levels**: Gamification and experience tracking

## 🌐 API Endpoints

### Places
- \`GET /api/places/search\` - Search places with filters
- \`GET /api/places/details\` - Get detailed place information
- \`GET /api/places/photo\` - Fetch place photos

### Photos
- \`POST /api/upload-photos\` - Upload review photos
- \`DELETE /api/delete-photo\` - Remove uploaded photos

### AI Enhancement
- \`POST /api/enhance-review-text\` - Enhance review text with AI

## 🔒 Security Architecture

### API Key Management
- Google Maps API key is stored server-side only
- All Maps operations go through secure API routes
- No sensitive keys are exposed to the client
- Environment variables follow the principle of least privilege

### Authentication & Authorization
- Supabase handles secure user authentication
- Row Level Security (RLS) policies protect data
- Server-side validation for all operations

## 🚀 Production Deployment

### Deploy to Vercel

1. **Connect your repository to Vercel**
   \`\`\`bash
   npm i -g vercel
   vercel
   \`\`\`

2. **Configure environment variables in Vercel**
   
   Add the following environment variables to your Vercel project settings:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`SUPABASE_SERVICE_ROLE_KEY\`
   - \`GOOGLE_MAPS_API_KEY\` (server-side only)
   - \`BLOB_READ_WRITE_TOKEN\`
   - \`OPENAI_API_KEY\`

3. **Set up integrations**
   - Add Supabase integration in Vercel dashboard
   - Add Vercel Blob integration
   - Configure Google Maps API with proper restrictions

4. **Deploy**
   \`\`\`bash
   vercel --prod
   \`\`\`

### Database Migration

Ensure your Supabase database is properly configured:

1. Run the unified database setup script
2. Enable Row Level Security (RLS) policies
3. Configure authentication providers
4. Set up storage buckets for photos

### Performance Optimizations

- Images are automatically compressed and optimized
- Lazy loading implemented for better performance
- Server-side rendering for SEO optimization
- Caching strategies for API responses
- Secure API routes prevent client-side key exposure

## 🔧 Configuration

### Google Maps Setup

1. Enable the following APIs in Google Cloud Console:
   - Maps JavaScript API
   - Places API
   - Geocoding API

2. Configure API key restrictions for security:
   - Restrict to your domain in production
   - Limit to specific APIs only
   - Set up usage quotas

3. **Important**: The API key is used server-side only through Next.js API routes for enhanced security

### Supabase Configuration

1. Set up authentication providers
2. Configure storage policies
3. Enable real-time subscriptions
4. Set up database triggers for notifications

## 📱 Mobile App Features

- Responsive design that works on all devices
- Bottom navigation for mobile users
- Touch-optimized interface
- Camera integration for photo uploads
- Location-based services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Development Guidelines

- Keep API keys server-side only
- Follow security best practices
- Test on multiple devices
- Maintain responsive design
- Document new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added AI text enhancement
- **v1.2.0** - Implemented achievement system
- **v1.3.0** - Added real-time notifications
- **v1.4.0** - Enhanced security with server-side API key management

---

Built with ❤️ by the Comidita team
