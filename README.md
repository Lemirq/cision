# Cision: AI-Powered Urban Road Safety Platform

<p align="center">
  <img src="public/Logo.svg" alt="Cision Logo" width="120" />
</p>

<p align="center">
  <strong>Cursor for City Planning</strong><br />
  Transform collision data into actionable, buildable intersection designs in minutes.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

---

## The Problem

Every year, **1.35 million people die** in road traffic accidents globally. In Toronto alone, there are **50,000+ reported collisions annually**. The data exists—but it's trapped in spreadsheets, buried in bureaucracy, and disconnected from the planning decisions that could prevent deaths.

**City planners face three critical gaps:**

1. **Data Gap**: Collision data is abstract and scattered—no visual context
2. **Analysis Gap**: Safety audits take months and cost thousands of dollars
3. **Communication Gap**: Planners can't easily show stakeholders why changes matter

## Our Solution

**Cision** is an AI-powered urban planning platform that transforms raw collision data into interactive 3D visualizations, instant safety audits, and stakeholder-validated redesigns—all in minutes, not months.

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Collision Data │────▶│  3D Heatmap     │────▶│  AI Safety      │────▶│  AI Redesign    │
│  (Toronto Open  │     │  Visualization  │     │  Audit          │     │  Generator      │
│   Data)         │     │                 │     │  (6 metrics)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────────┐
                                                           │  Voice Agent    │
                                                           │  Stakeholders   │
                                                           │  (Cyclist, Mayor,│
                                                           │   Engineer)     │
                                                           └─────────────────┘
```

---

## 🚀 Features

### 1. Interactive Collision Heatmap
- **3D MapGL-powered visualization** with clustered hotspots
- Color-coded by severity (green → red based on collision count and fatality rate)
- Fly-to animation on selection with 3D building extrusion
- Filter by collision type: fatalities, cyclist-involved, pedestrian-involved

### 2. AI Safety Audit (Auto-Generated)
Click any hotspot to instantly generate a comprehensive safety audit:
- **6 Safety Metrics** (0-100 scale): Signage, Lighting, Crosswalk Visibility, Bike Infrastructure, Pedestrian Infrastructure, Traffic Calming
- **4-Direction Street View Composite**: Automatically stitches North/East/South/West views
- **Identified Safety Flaws** with severity levels (high/medium/low)
- **Improvement Suggestions** with priority, estimated cost, and expected impact
- **Missing Infrastructure Checklist**

### 3. AI-Powered Intersection Redesign
- **Natural language image generation**: Type "add protected bike lanes" and watch the intersection transform
- **Version history carousel**: Compare original vs. generated designs
- **Iteration workflow**: Refine designs incrementally
- **Image persistence**: All versions saved for comparison

### 4. Multi-Persona Voice Agents
Three AI stakeholders, powered by **ElevenLabs**, provide instant feedback:

| Persona | Role | Perspective |
|---------|------|-------------|
| **Harsh Mehta** | DoorDash Courier & Collision Survivor | "How does this protect vulnerable road users?" |
| **Olivia Chow** | Mayor of Toronto | "Does this fit our Vision Zero budget and priorities?" |
| **Marcus Chen** | Traffic Engineer, P.Eng. | "Do lane widths meet code? Is it buildable?" |

- Real-time voice conversations with live transcription
- Dynamic context injection (safety audit data feeds into agent prompts)

### 5. Smart Intersection Search
- Search by intersection name ("Queen & Spadina")
- Search by address with Google Places autocomplete
- Keyboard navigation support
- Recent search history

### 6. Collision Statistics Dashboard
- **Date range analysis**: See collision trends over time
- **Victim breakdown**: Fatalities, cyclists, pedestrians
- **Normalized severity scoring**: Relative ranking vs. city-wide data
- **Environmental context**: Time of day, day of week patterns

---

## 🎥 Demo

**Watch our 3-minute demo:** [Link to demo video]

<p align="center">
  <a href="/yur.mov">
    <img src="public/demo-preview.jpg" alt="Cision Demo Preview" width="600" />
  </a>
</p>

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router, React 19)
- **TypeScript** (strict mode)
- **React Map GL / Mapbox** (3D mapping)
- **Tailwind CSS** + **Framer Motion** (animations)
- **Zustand** (state management)
- **Vercel AI SDK** (chat + image generation)

### Backend & APIs
- **Next.js API Routes** (serverless)
- **MongoDB** (collision data storage)
- **OpenAI GPT-4o** (safety audit generation)
- **ElevenLabs** (voice agents)
- **Google Places API** (autocomplete + place details)

### AI/ML
- **Nano Banana Pro** (image generation for redesigns)
- **OpenAI Vision** (Street View analysis)
- **Custom clustering algorithm** (collision hotspot detection)

### Infrastructure
- **Vercel** (deployment)
- **Mapbox** (maps)
- **GitHub Actions** (CI/CD)

---

## 📁 Project Structure

```
cision/
├── app/
│   ├── api/
│   │   ├── chat/           # AI redesign chat endpoint
│   │   ├── clusters/       # Collision cluster data
│   │   ├── collisions/     # Individual collision records
│   │   ├── image-generation/
│   │   ├── places/         # Google Places integration
│   │   ├── safety-audit/   # AI safety audit generation
│   │   └── streetview/     # Street View image fetching
│   ├── map/                # Main app page
│   └── page.tsx            # Landing page
├── components/
│   ├── map/                # CityMap, layers, heatmap
│   ├── search/             # SearchBar with autocomplete
│   ├── sidebar/
│   │   ├── intersection-sidebar/   # Selected intersection details
│   │   ├── persona-sidebar/        # Voice agent selection
│   │   ├── safety-audit-sidebar/   # Audit results
│   │   └── image-chat-sidebar/     # AI redesign chat
│   └── ui/                 # Shared UI components
├── lib/
│   ├── cluster-storage.ts  # Cluster state management
│   ├── clustering.ts       # Collision clustering logic
│   ├── prompts/personas.ts # Voice agent prompts
│   └── severity-normalization.ts
├── stores/
│   └── map-store.ts        # Global state (Zustand)
├── types/
│   ├── collision.ts
│   ├── safety-audit.ts
│   └── cluster-storage.ts
└── public/                 # Static assets
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / bun
- Mapbox API token
- OpenAI API key
- ElevenLabs API key
- Google Places API key (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cision.git
cd cision

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
# OPENAI_API_KEY=sk.xxx
# ELEVENLABS_API_KEY=xi.xxx

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_key
```

---

## 🏆 Hackathon Innovations

### What Makes Cision Hackathon-Worthy

1. **End-to-End AI Integration**: Not just one AI feature, but a cohesive pipeline—data → visualization → audit → redesign → stakeholder validation

2. **Real-Time Voice Agents**: ElevenLabs-powered conversations with dynamic context injection. Agents know the intersection's safety score, flaws, and suggestions in real-time.

3. **Multi-Modal UX**: Combines maps, Street View, chat, voice, and image generation into a unified workflow

4. **Production-Ready Code**: Built with Next.js 15, TypeScript strict mode, and proper architecture—ready to scale

5. **Open Data Integration**: Leverages real Toronto collision data (open data portal) for authenticity and impact

### Potential Extensions

- **More cities**: Expand beyond Toronto to any city with open collision data
- **Cost estimation**: Add real construction cost modeling
- **Council integration**: Export designs to CAD/BIM formats for actual planning
- **Community feedback**: Let residents submit intersection concerns via a mobile app
- **Historical analysis**: Track before/after safety improvements

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Toronto Open Data Portal** for collision data
- **Mapbox** for amazing mapping tools
- **ElevenLabs** for realistic voice synthesis
- **OpenAI** for GPT-4o and image generation
- **DeltaHacks 2026** for the opportunity to build this

---

<p align="center">
  <strong>Built with ❤️ for safer cities</strong><br />
  Cision — Cursor for City Planning
</p>
