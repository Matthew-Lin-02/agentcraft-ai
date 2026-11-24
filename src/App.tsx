import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Database,
  Copy,
  Plus,
  Trash2,
  Share2,
  FileText,
  Mail,
  Search,
  Terminal,
  RefreshCw,
  MapPin,
  Code,
  Zap,
  X,
  CheckCircle2,
  LogOut,
  LogIn
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Preset sample properties for 1-Click Fitzroy demo load
const DEMO_PROPERTIES = [
  {
    address: '42 Moor Street',
    suburb: 'Fitzroy',
    propertyType: 'Victorian Single-Fronted Terrace',
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    features: [
      'North-Facing Courtyard',
      'Architectural Extension',
      'Period Detail Ceiling Roses',
      'Custom Timber Joinery',
      'Hydronic Heating'
    ],
    targetPersona: 'Professional Couple',
    tone: 'Sophisticated & Emotional',
    agentNotes:
      'Steps from Brunswick St cafes and Edinburgh Gardens. Retains 1890s historic facade with seamless light-filled modern living zone.'
  },
  {
    address: '108/15 Leicester Street',
    suburb: 'Carlton',
    propertyType: 'Modern Architect-Designed Apartment',
    bedrooms: 2,
    bathrooms: 2,
    carSpaces: 1,
    features: [
      'Panoramic City Views',
      'Miele Appliances',
      'Secure Intercom',
      'Rooftop Terrace Access',
      'High Rental Yield'
    ],
    targetPersona: 'Astute Investor',
    tone: 'Investment & Yield Focused',
    agentNotes:
      'High capital growth pocket near Melbourne University and hospital precincts. Currently tenanted at $750/week.'
  },
  {
    address: '89 Westgarth Street',
    suburb: 'Northcote',
    propertyType: 'Edwardian Family Residence',
    bedrooms: 4,
    bathrooms: 2,
    carSpaces: 2,
    features: [
      'Deep Solar-Heated Pool',
      'Master Suite Walk-In',
      'Off-Street Parking',
      'Zoned for Northcote High',
      'Custom Cellar'
    ],
    targetPersona: 'Growing Family',
    tone: 'Prestigious & High-End',
    agentNotes:
      'Magnificent family home on generous 550sqm block. Walk to Dennis Station and High Street shopping strip.'
  }
];

function normalizeListingRow(row: any) {
  return {
    id: row.id,
    address: row.address,
    suburb: row.suburb,
    propertyType: row.property_type ?? row.propertyType,
    bedrooms: row.bedrooms ?? 1,
    bathrooms: row.bathrooms ?? 1,
    carSpaces: row.car_spaces ?? row.carSpaces ?? 0,
    features: Array.isArray(row.features) ? row.features : [],
    targetPersona: row.target_persona ?? row.targetPersona ?? 'Professional Couple',
    tone: row.tone ?? 'Sophisticated & Emotional',
    agentNotes: row.agent_notes ?? row.agentNotes ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
    status: row.status ?? 'draft',
    generatedCopy: row.generated_copy ?? row.generatedCopy
  };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'generator' | 'database' | 'architecture'>(
    'generator'
  );

  // Form State
  const [formData, setFormData] = useState({
    address: '18 Derby Street',
    suburb: 'Fitzroy',
    propertyType: 'Victorian Single-Fronted Terrace',
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    features: [
      'North-Facing Courtyard',
      'Renovated Kitchen',
      'Period Features',
      'Hydronic Heating'
    ],
    newFeatureTag: '',
    targetPersona: 'Professional Couple',
    tone: 'Sophisticated & Emotional',
    agentNotes:
      'High ceilings, marble benchtops, original fireplaces, 200m from Gertrude Street.'
  });

  // AI Generation Simulation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'rea' | 'social' | 'email' | 'json'>(
    'rea'
  );

  // Saved Listings State (Supabase Postgres)
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suburbFilter, setSuburbFilter] = useState('All');
  const [personaFilter, setPersonaFilter] = useState('All');
  const [selectedListingModal, setSelectedListingModal] = useState<any>(null);

  // UI Toast Feedback
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Fetch saved listings for the current authenticated user
  const fetchListings = async () => {
    if (!session?.user) {
      setSavedListings([]);
      return;
    }

    setIsLoadingListings(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      showToast(`Supabase load error: ${error.message}`, 'error');
    } else if (data) {
      setSavedListings(data.map(normalizeListingRow));
    }
    setIsLoadingListings(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchListings();
    } else {
      setSavedListings([]);
    }
  }, [session?.user?.id]);

  const handleSignInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      showToast(`Google sign-in failed: ${error.message}`, 'error');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(`Sign-out failed: ${error.message}`, 'error');
    } else {
      setSavedListings([]);
      showToast('Signed out', 'info');
    }
  };

  // Helper: Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  // Load Demo Data helper
  const handleLoadDemo = (demoIndex = 0) => {
    const demo = DEMO_PROPERTIES[demoIndex];
    setFormData({
      ...formData,
      address: demo.address,
      suburb: demo.suburb,
      propertyType: demo.propertyType,
      bedrooms: demo.bedrooms,
      bathrooms: demo.bathrooms,
      carSpaces: demo.carSpaces,
      features: [...demo.features],
      targetPersona: demo.targetPersona,
      tone: demo.tone,
      agentNotes: demo.agentNotes
    });
    showToast(`Loaded ${demo.suburb} property demo data!`);
  };

  // Add Feature Tag
  const handleAddFeature = () => {
    if (
      formData.newFeatureTag.trim() &&
      !formData.features.includes(formData.newFeatureTag.trim())
    ) {
      setFormData({
        ...formData,
        features: [...formData.features, formData.newFeatureTag.trim()],
        newFeatureTag: ''
      });
    }
  };

  // Remove Feature Tag
  const handleRemoveFeature = (tagToRemove: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((f) => f !== tagToRemove)
    });
  };

  // Run AI Generation
  const handleGenerateCopy = () => {
    if (!formData.address || !formData.suburb) {
      showToast('Please enter an address and suburb', 'error');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => setGenerationStep(2), 700);
    setTimeout(() => setGenerationStep(3), 1400);

    setTimeout(() => {
      const copyResult = {
        rea: {
          headline: `${formData.suburb.toUpperCase()} ELEGANCE: ${formData.propertyType.toUpperCase()} WITH PREMIUM FINISHES`,
          subheadline: `A masterclass in inner-north living at ${formData.address}, ${formData.suburb}`,
          narrative: `Positioned in one of ${formData.suburb}'s most sought-after tree-lined pockets, ${formData.address} represents a rare fusion of classic character and elevated modern lifestyle. Designed for buyers who demand both style and location, this immaculate ${formData.bedrooms}-bedroom, ${formData.bathrooms}-bathroom home delivers instant warmth upon entry. High ceilings and meticulous craftsmanship set the tone, while expansive light-filled living spaces flow effortlessly into the private outdoor sanctuary.`,
          bulletPoints: [
            ...formData.features.map((f) => `Key Highlight: ${f}`),
            `Generous accommodations featuring ${formData.bedrooms} bedrooms & ${formData.bathrooms} contemporary bathrooms`,
            `Convenient secure parking for ${formData.carSpaces} vehicle(s)`,
            `Tailored for ${formData.targetPersona.toLowerCase()} looking for turn-key luxury`
          ],
          locationPitch: `Located in prime ${formData.suburb}, moments from local coffee hotspots, boutique shopping, lush parklands, and rapid transport links straight into the Melbourne CBD.`
        },
        social: {
          instagram: `🏡 JUST LISTED | ${formData.address.toUpperCase()}, ${formData.suburb.toUpperCase()}\n\nLooking for your dream ${formData.propertyType.toLowerCase()}? This absolute gem features ${formData.features.slice(0, 3).join(', ')} & so much more! 🔥\n\n🛏 ${formData.bedrooms} Bed | 🛁 ${formData.bathrooms} Bath | 🚗 ${formData.carSpaces} Car\n🎯 Perfect for: ${formData.targetPersona}\n📍 ${formData.suburb}, Melbourne\n\nTap the link in bio to book your private inspection with our Real Estate Agency!\n\n#NelsonAlexander #${formData.suburb.replace(/\s+/g, '')}RealEstate #MelbourneHomes #PropertyListing #InnerNorthRealEstate`,
          facebook: `✨ NEW TO MARKET: ${formData.address}, ${formData.suburb}\n\nReal Estate Agency is proud to present this stunning ${formData.propertyType.toLowerCase()}. Boasting ${formData.bedrooms} bedrooms and ${formData.bathrooms} bathrooms, highlights include ${formData.features.join(', ')}.\n\nDon't miss the first open inspection this weekend. Contact our office today for full digital floorplans and section 32 details.`
        },
        email: {
          subject: `VIP Preview: ${formData.propertyType} in ${formData.suburb} - ${formData.address}`,
          body: `Hi [First Name],\n\nGiven your interest in properties across ${formData.suburb}, I wanted to give you priority access to ${formData.address} before public advertising goes live on Domain and REA.\n\nThis outstanding ${formData.bedrooms}-bedroom home offers key features tailored for ${formData.targetPersona.toLowerCase()} including:\n- ${formData.features.slice(0, 3).join('\n- ')}\n\nWould you like to schedule an advance inspection prior to Saturday's public open home?\n\nWarm regards,\n\nReal Estate Agency Real Estate`
        }
      };

      setGeneratedCopy(copyResult);
      setIsGenerating(false);
      setGenerationStep(0);
      showToast('AI Listing Suite Generated Successfully!');
    }, 2200);
  };

  // Save generated copy to real Supabase Postgres DB
  const handleSaveToDatabase = async () => {
    if (!session?.user) {
      showToast('Please sign in with Google before saving listings.', 'error');
      return;
    }

    if (!generatedCopy) return;

    setIsSaving(true);
    const payload = {
      user_id: session.user.id,
      address: formData.address.trim(),
      suburb: formData.suburb.trim(),
      property_type: formData.propertyType,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      car_spaces: Number(formData.carSpaces),
      features: formData.features,
      target_persona: formData.targetPersona,
      tone: formData.tone,
      agent_notes: formData.agentNotes,
      status: 'draft',
      generated_copy: generatedCopy
    };

    const { data, error } = await supabase
      .from('listings')
      .insert([payload])
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      console.error('Supabase insert error:', error);
      showToast(`Failed to save to Supabase: ${error.message}`, 'error');
      return;
    }

    if (data) {
      setSavedListings((prev) => [normalizeListingRow(data), ...prev]);
      showToast('Saved listing to Supabase Postgres!');
    }
  };

  // Delete saved listing from Supabase Postgres DB
  const handleDeleteListing = async (id: string) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      showToast(`Failed to delete listing: ${error.message}`, 'error');
      return;
    }

    setSavedListings((prev) => prev.filter((item) => item.id !== id));
    if (selectedListingModal?.id === id) {
      setSelectedListingModal(null);
    }
    showToast('Listing deleted from Supabase', 'info');
  };

  // Filtered saved listings
  const filteredListings = savedListings.filter((item) => {
    const matchesSearch =
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.suburb.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSuburb = suburbFilter === 'All' || item.suburb === suburbFilter;
    const matchesPersona = personaFilter === 'All' || item.targetPersona === personaFilter;
    return matchesSearch && matchesSuburb && matchesPersona;
  });

  const userDisplayLabel =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    'Signed in';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-wide">AgentCraft AI</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                Real Estate Agency Operations Tech
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated Property Listing &amp; Campaign Intelligence Platform
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'generator'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copy Generator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('database');
              fetchListings();
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'database'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Saved Listings ({savedListings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'architecture'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Architecture &amp; MCP</span>
          </button>
        </nav>

        {/* Auth Controls */}
        <div className="flex items-center space-x-3">
          {!session ? (
            <button
              type="button"
              onClick={handleSignInWithGoogle}
              className="inline-flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-700" />
              <span>Sign in with Google</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
              <div className="text-right leading-tight">
                <p className="text-xs font-medium text-slate-100">{userDisplayLabel}</p>
                {session.user.email && userDisplayLabel !== session.user.email && (
                  <p className="text-[11px] text-slate-400">{session.user.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-md transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center space-x-2 text-sm ${toast.type === 'error'
            ? 'bg-red-950 border-red-700 text-red-200'
            : toast.type === 'info'
              ? 'bg-sky-950 border-sky-700 text-sky-200'
              : 'bg-emerald-950 border-emerald-600 text-emerald-200'
            }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
        {/* TAB 1: AI COPY GENERATOR STUDIO */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Property Data Input Form */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h2 className="font-semibold text-slate-100">Property Details</h2>

                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-400 mr-1 uppercase tracking-wider font-mono">
                      Quick Fill:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadDemo(0)}
                      className="px-2 py-1 text-[11px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded font-medium transition"
                    >
                      Fitzroy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDemo(1)}
                      className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-medium transition"
                    >
                      Carlton
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDemo(2)}
                      className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-medium transition"
                    >
                      Northcote
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Street Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. 42 Moor Street"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 pl-8"
                      />
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Suburb
                      </label>
                      <select
                        value={formData.suburb}
                        onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Fitzroy">Fitzroy</option>
                        <option value="Collingwood">Collingwood</option>
                        <option value="Northcote">Northcote</option>
                        <option value="Brunswick">Brunswick</option>
                        <option value="East Melbourne">East Melbourne</option>
                        <option value="Carlton">Carlton</option>
                        <option value="Abbotsford">Abbotsford</option>
                        <option value="Clifton Hill">Clifton Hill</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Property Type
                      </label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) =>
                          setFormData({ ...formData, propertyType: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Victorian Single-Fronted Terrace">
                          Victorian Terrace
                        </option>
                        <option value="Edwardian Family Residence">Edwardian Residence</option>
                        <option value="Modern Architect-Designed Apartment">
                          Modern Apartment
                        </option>
                        <option value="Industrial Warehouse Conversion">Warehouse Loft</option>
                        <option value="Luxury Townhouse">Luxury Townhouse</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.bedrooms}
                        onChange={(e) =>
                          setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.bathrooms}
                        onChange={(e) =>
                          setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Car Spaces
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.carSpaces}
                        onChange={(e) =>
                          setFormData({ ...formData, carSpaces: parseInt(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Target Persona
                      </label>
                      <select
                        value={formData.targetPersona}
                        onChange={(e) =>
                          setFormData({ ...formData, targetPersona: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Professional Couple">Professional Couple</option>
                        <option value="First-Home Buyer">First-Home Buyer</option>
                        <option value="Astute Investor">Astute Investor</option>
                        <option value="Growing Family">Growing Family</option>
                        <option value="Downsizer">Downsizer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tone &amp; Style
                      </label>
                      <select
                        value={formData.tone}
                        onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Sophisticated & Emotional">
                          Sophisticated &amp; Emotional
                        </option>
                        <option value="Prestigious & High-End">
                          Prestigious &amp; High-End
                        </option>
                        <option value="Punchy & Modern">Punchy &amp; Modern</option>
                        <option value="Investment & Yield Focused">Investment &amp; Yield</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Key Property Feature Tags
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={formData.newFeatureTag}
                        onChange={(e) =>
                          setFormData({ ...formData, newFeatureTag: e.target.value })
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddFeature())
                        }
                        placeholder="Add feature (e.g. Solar Panels)"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                      {formData.features.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs px-2.5 py-1 rounded-md flex items-center space-x-1.5"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(tag)}
                            className="text-emerald-400 hover:text-emerald-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Agent Raw Notes &amp; Context
                    </label>
                    <textarea
                      rows={2}
                      value={formData.agentNotes}
                      onChange={(e) => setFormData({ ...formData, agentNotes: e.target.value })}
                      placeholder="Add key highlights, proximity to streets, auction dates or vendor requirements..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCopy}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-[0.99] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing with Claude API...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Generate Multi-Channel Campaign Suite</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: AI Generated Output Canvas */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {isGenerating && (
                <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-slate-100">
                      Generating Optimized Copy Package
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {generationStep === 1 &&
                        'Step 1/3: Injecting Real Estate Agency style guidelines & Melbourne location tokens...'}
                      {generationStep === 2 &&
                        'Step 2/3: Synthesizing persona framing for ' + formData.targetPersona + '...'}
                      {generationStep === 3 &&
                        'Step 3/3: Structuring REA, Social & Email payloads...'}
                    </p>
                  </div>
                </div>
              )}

              {!isGenerating && !generatedCopy && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="font-semibold text-slate-100">Ready to Generate Copy</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Fill in property details on the left or click a Quick Fill suburb preset, then
                    click &ldquo;Generate Multi-Channel Campaign Suite&rdquo;.
                  </p>
                </div>
              )}

              {!isGenerating && generatedCopy && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveOutputTab('rea')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${activeOutputTab === 'rea'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>REA / Domain</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveOutputTab('social')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${activeOutputTab === 'social'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Social</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveOutputTab('email')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${activeOutputTab === 'email'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Buyer Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveOutputTab('json')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${activeOutputTab === 'json'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>JSON</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveToDatabase}
                      disabled={isSaving}
                      className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save to Supabase'}</span>
                    </button>
                  </div>

                  {activeOutputTab === 'rea' && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-white">{generatedCopy.rea.headline}</p>
                          <p className="text-xs text-emerald-400 mt-0.5">
                            {generatedCopy.rea.subheadline}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              `${generatedCopy.rea.headline}\n\n${generatedCopy.rea.narrative}\n\n${generatedCopy.rea.bulletPoints.join('\n')}\n\n${generatedCopy.rea.locationPitch}`,
                              'REA copy'
                            )
                          }
                          className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-xs px-2.5 py-1.5 rounded-md text-slate-200"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{generatedCopy.rea.narrative}</p>
                      <ul className="space-y-1 text-xs text-slate-300 list-disc pl-5">
                        {generatedCopy.rea.bulletPoints.map((pt: string, i: number) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-400 border-t border-slate-800 pt-2.5">
                        {generatedCopy.rea.locationPitch}
                      </p>
                    </div>
                  )}

                  {activeOutputTab === 'social' && (
                    <div className="space-y-4 text-xs">
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-400">Instagram Post</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(generatedCopy.social.instagram, 'Instagram post')
                            }
                            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-200"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-slate-300">
                          {generatedCopy.social.instagram}
                        </pre>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sky-400">Facebook Post</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(generatedCopy.social.facebook, 'Facebook post')
                            }
                            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-200"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-slate-300">
                          {generatedCopy.social.facebook}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeOutputTab === 'email' && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <p className="font-semibold text-slate-100">
                          Subject: {generatedCopy.email.subject}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              `Subject: ${generatedCopy.email.subject}\n\n${generatedCopy.email.body}`,
                              'Buyer email'
                            )
                          }
                          className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-200"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                        {generatedCopy.email.body}
                      </pre>
                    </div>
                  )}

                  {activeOutputTab === 'json' && (
                    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
                      {JSON.stringify(generatedCopy, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SAVED LISTINGS (SUPABASE POSTGRES) */}
        {activeTab === 'database' && (
          <div className="space-y-5">
            {!session ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                <p className="text-sm font-medium text-slate-200">
                  Sign in with Google to view your saved listings.
                </p>
                <button
                  type="button"
                  onClick={handleSignInWithGoogle}
                  className="inline-flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs px-4 py-2 rounded-lg transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search saved address or suburb..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <select
                      value={suburbFilter}
                      onChange={(e) => setSuburbFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                    >
                      <option value="All">All Suburbs</option>
                      <option value="Fitzroy">Fitzroy</option>
                      <option value="Carlton">Carlton</option>
                      <option value="Northcote">Northcote</option>
                      <option value="Collingwood">Collingwood</option>
                      <option value="Brunswick">Brunswick</option>
                    </select>
                    <select
                      value={personaFilter}
                      onChange={(e) => setPersonaFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100"
                    >
                      <option value="All">All Personas</option>
                      <option value="Professional Couple">Professional Couple</option>
                      <option value="First-Home Buyer">First-Home Buyer</option>
                      <option value="Astute Investor">Astute Investor</option>
                      <option value="Growing Family">Growing Family</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={fetchListings}
                    className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg text-slate-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingListings ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
                    Loading listings from Supabase...
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
                    No listings found for your account yet. Generate copy and click &ldquo;Save to
                    Supabase&rdquo;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredListings.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
                              {item.suburb}
                            </span>
                            <span>{new Date(item.created_at).toLocaleDateString('en-AU')}</span>
                          </div>
                          <h3 className="font-semibold text-white text-base">{item.address}</h3>
                          <p className="text-xs text-slate-400">
                            {item.propertyType} · {item.bedrooms} Bed · {item.bathrooms} Bath ·{' '}
                            {item.carSpaces} Car
                          </p>
                          <p className="text-xs text-slate-300 line-clamp-3">
                            {item.generatedCopy?.rea?.narrative}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                          <button
                            type="button"
                            onClick={() => setSelectedListingModal(item)}
                            className="text-xs font-medium text-emerald-400 hover:underline"
                          >
                            Inspect Campaign
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteListing(item.id)}
                            className="text-red-400 hover:text-red-300 p-1 rounded"
                            title="Delete from Supabase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 3: ARCHITECTURE & MCP */}
        {activeTab === 'architecture' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-white">1. AI &amp; Structured Outputs</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates structured REA/Domain descriptions, social copy, and buyer outreach from
                property specs and persona context to cut manual listing prep.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-white">2. Per-User Supabase Postgres &amp; RLS</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scopes listings by authenticated `user_id` (`auth.uid()`) via Postgres Row-Level
                Security and Google OAuth.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-white">3. CRM, Webhooks &amp; Entra ID</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ready to connect with internal CRM webhooks, Model Context Protocol (MCP) tools, and
                Microsoft Entra ID authentication for staff workflows.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Listing Detail Modal */}
      {selectedListingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-lg">
                  {selectedListingModal.address}, {selectedListingModal.suburb}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedListingModal.propertyType} · {selectedListingModal.bedrooms} Bed ·{' '}
                  {selectedListingModal.bathrooms} Bath · {selectedListingModal.carSpaces} Car
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <p className="font-semibold text-emerald-400 mb-1">REA / Domain</p>
                <p className="font-bold text-white">
                  {selectedListingModal.generatedCopy?.rea?.headline}
                </p>
                <p className="mt-1 leading-relaxed">
                  {selectedListingModal.generatedCopy?.rea?.narrative}
                </p>
              </div>
              <div>
                <p className="font-semibold text-emerald-400 mb-1">Instagram</p>
                <pre className="whitespace-pre-wrap font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {selectedListingModal.generatedCopy?.social?.instagram}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-emerald-400 mb-1">Buyer Email</p>
                <p className="font-medium text-white mb-1">
                  Subject: {selectedListingModal.generatedCopy?.email?.subject}
                </p>
                <pre className="whitespace-pre-wrap font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {selectedListingModal.generatedCopy?.email?.body}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}