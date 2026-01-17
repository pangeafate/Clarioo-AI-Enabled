import React, { useState, useRef, useEffect } from 'react';

/**
 * CLARIOO LANDING V4 — обновлённая версия
 * 
 * Изменения:
 * 1. Заголовок про решение, не про компанию
 * 2. Позитивные цитаты вместо негативных
 * 3. Expert Validated бейдж на карточках
 * 4. Flow: Explore сначала, Use Template внутри (Вариант B)
 * 5. Только кнопка "Explore with Clarioo" в Hero
 */
const templates = [
  {
    id: 'pm-agency-001',
    category: 'Project Management',
    categoryColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    glowColor: '#3b82f6',
    // Заголовок про решение
    companyType: 'Lightweight PM with Billing & Resource Planning',
    // Упрощённый формат: тип компании + размер
    companyDetails: 'Agency – 10-100 employees',
    currentTool: 'Trello + Google Sheets',
    painQuote: "Clear deadlines, easy visibility into who's available, accurate client billing",
    lookingFor: ['Resource planning', 'Time tracking', 'Client billing', 'Portfolio visibility'],
    criteriaCount: 8,
    inputCompany: "We are a rapidly growing digital marketing agency based in Europe. We currently have about 45 employees and manage around 30 simultaneous client projects.",
    inputNeed: "Currently, we use a mix of free Trello boards and Google Sheets for project tracking, but it's total chaos. We are missing deadlines and can't see who is available for new work. We need better resource planning, time tracking for client billing, and high-level visibility across all projects. We are afraid of complex enterprise tools that take months to set up."
  },
  {
    id: 'crm-saas-002',
    category: 'CRM',
    categoryColor: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    glowColor: '#10b981',
    companyType: 'Sales CRM for Growing SaaS Teams',
    // Упрощённый формат
    companyDetails: 'B2B SaaS – 20-50 employees',
    currentTool: 'HubSpot free tier + spreadsheets',
    painQuote: "Clear pipeline visibility, every deal tracked, ready to scale with the team",
    lookingFor: ['Pipeline management', 'Email tracking', 'Sales reporting', 'Forecasting'],
    criteriaCount: 9,
    inputCompany: "We are a B2B SaaS startup based in the US with 35 employees. We sell project management software to mid-market companies. Our sales team has 8 account executives and 4 SDRs. We closed $2M ARR last year and targeting $5M this year.",
    inputNeed: "We've outgrown HubSpot free tier and spreadsheets for tracking deals. We need a proper CRM that can handle our sales pipeline, track customer interactions, and integrate with our email (Google Workspace) and calendar. Key requirements: deal pipeline management, email tracking, reporting on sales metrics, and ability to scale as we grow. We don't need marketing automation — just sales CRM."
  },
  {
    id: 'erp-manufacturing-003',
    category: 'ERP',
    categoryColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    glowColor: '#f59e0b',
    companyType: 'Modern ERP for Mid-Size Manufacturing',
    // Упрощённый формат
    companyDetails: 'Manufacturing – 200-500 employees',
    currentTool: 'SAP Business One (15 years old)',
    painQuote: "Unified system, real-time inventory, seamless data flow across all facilities",
    lookingFor: ['Inventory management', 'Production planning', 'Supply chain', 'Financials'],
    criteriaCount: 12,
    inputCompany: "We are a mid-size manufacturing company in Germany producing industrial equipment. 450 employees across 3 facilities. We have complex supply chain with 200+ suppliers and sell to distributors across Europe. Annual revenue ~€80M.",
    inputNeed: "Our current setup is a nightmare — SAP Business One that's 15 years old, disconnected inventory spreadsheets, and a separate accounting system. We need a modern ERP that unifies production planning, inventory management, procurement, and financials. Must handle multi-site operations, BOM management, and integrate with our existing shop floor systems. German/EU data residency required for compliance."
  },
  {
    id: 'ats-agency-004',
    category: 'ATS & Recruiting',
    categoryColor: 'bg-purple-500',
    textColor: 'text-purple-600',
    glowColor: '#a855f7',
    companyType: 'Agency-First ATS with Client Portal',
    // Упрощённый формат
    companyDetails: 'Recruiting Agency – 50-100 employees',
    currentTool: 'LinkedIn + Email + Notion',
    painQuote: "Zero duplicate submissions, seamless client collaboration, never lose a candidate",
    lookingFor: ['Duplicate prevention', 'Client portal', 'CV parsing', 'LinkedIn sync'],
    criteriaCount: 11,
    inputCompany: "Our London-based specialized tech recruiting agency (85 employees) currently manages ~150 open roles and 3,000+ applications per month using LinkedIn Recruiter, email and Notion.",
    inputNeed: "We're drowning in tracking chaos, duplicate submissions to clients, and poor collaboration with our startup/scale-up clients across the UK & Europe. We require a turnkey Applicant Tracking System tailored to an agency business model, with intuitive UI for non-technical recruiters. Key constraints: automated CV parsing, LinkedIn & major job-board integrations, client-facing collaboration portal, duplicate-submission prevention, GDPR compliance, EU data residency."
  },
  {
    id: 'support-ecommerce-005',
    category: 'Customer Support',
    categoryColor: 'bg-rose-500',
    textColor: 'text-rose-600',
    glowColor: '#f43f5e',
    companyType: 'Helpdesk for E-commerce with Shopify Integration',
    // Упрощённый формат
    companyDetails: 'E-commerce – 100-200 employees',
    currentTool: 'Shared Gmail inbox + Slack',
    painQuote: "Every message tracked, fast response times, happy customers across all channels",
    lookingFor: ['Shared inbox', 'Live chat', 'Ticket management', 'Shopify sync'],
    criteriaCount: 10,
    inputCompany: "We are a growing e-commerce company based in the UK selling home goods. 120 employees, processing about 50,000 orders per month. Our customer base is primarily in UK and EU.",
    inputNeed: "Customer emails are getting lost in our shared Gmail inbox. No way to track response times or see conversation history across channels. We also get inquiries via Instagram and our website chat. We need a proper helpdesk with shared inbox, live chat, ticket management, and Shopify integration. Worried about tools that require dedicated support staff to configure and maintain."
  },
  {
    id: 'ai-meeting-006',
    category: 'AI Meeting Assistant',
    categoryColor: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    glowColor: '#06b6d4',
    companyType: 'Enterprise AI Notetaker with CRM Sync',
    // Упрощённый формат
    companyDetails: 'Consulting – 100-200 employees',
    currentTool: 'Manual note-taking',
    painQuote: "Automatic notes, action items captured, everything synced to CRM instantly",
    lookingFor: ['Transcription', 'Action items', 'CRM sync', 'Multi-language'],
    criteriaCount: 9,
    inputCompany: "We are a management consulting firm based in Germany with 180 employees. Our teams are multilingual (German, English, French) and we have clients across Europe. Heavy meeting culture with 20+ client meetings per consultant per week.",
    inputNeed: "Our consultants waste hours writing meeting notes manually. Action items get lost between meetings, and nothing syncs back to our CRM (Salesforce) automatically. We need an AI meeting assistant that can transcribe in multiple languages, extract action items automatically, and integrate with Salesforce. Enterprise security is a must — SSO, EU data residency, SOC2 compliance."
  },
];

const TemplateCard = ({ template, onClick, isActive, isApplied }) => {
  return (
    <div
      onClick={() => !isApplied && onClick(template)}
      className={`
        group relative bg-white rounded-xl overflow-hidden cursor-pointer 
        border shadow-sm transition-all duration-300 flex flex-col flex-shrink-0
        ${isActive 
          ? 'border-transparent scale-[1.02]' 
          : isApplied 
            ? 'border-gray-200 opacity-90'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
        }
      `}
      style={{ 
        width: '340px', 
        minHeight: '380px',
        boxShadow: isActive 
          ? `0 0 0 2px ${template.glowColor}, 0 0 30px ${template.glowColor}40, 0 20px 40px -10px rgba(0,0,0,0.15)` 
          : undefined
      }}
    >
      {/* Color accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${template.categoryColor}`} />
      
      {/* Applied badge */}
      {isApplied && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium z-10">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Applied
        </div>
      )}
      
      {/* Main content */}
      <div className="p-5 pl-6 flex-1 flex flex-col">
        {/* Top row: Category */}
        <div className="flex items-center justify-between mb-3">
          <div className={`text-xs font-semibold uppercase tracking-wide ${template.textColor}`}>
            {template.category}
          </div>
        </div>

        {/* Company Type - black */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {template.companyType}
        </h3>
        
        {/* Searched by - company type */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-400 uppercase mb-1">Searched by:</div>
          <p className="text-sm text-gray-600">
            {template.companyDetails}
          </p>
        </div>

        {/* Key Features - chips */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-400 uppercase mb-2">Key features:</div>
          <div className="flex flex-wrap gap-1.5">
            {template.lookingFor.map((item, index) => (
              <span 
                key={index}
                className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Pain Quote - attached to Looking For */}
        <div className="border-l-2 border-gray-200 pl-3">
          <p className="text-gray-600 text-sm italic">
            "{template.painQuote}"
          </p>
        </div>
      </div>

      {/* Footer CTA - shows value */}
      <div className={`
        px-5 pl-6 py-3 border-t border-gray-100 flex items-center justify-between transition-colors
        ${isApplied ? 'bg-green-50' : 'bg-gray-50 group-hover:bg-blue-50'}
      `}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium transition-colors ${isApplied ? 'text-green-600' : 'text-gray-600 group-hover:text-blue-600'}`}>
            {isApplied ? 'Template applied' : `Get ${template.criteriaCount} criteria`}
          </span>
          {!isApplied && (
            <span className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors">
              → Compare vendors
            </span>
          )}
        </div>
        {!isApplied && (
          <svg 
            className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
};

const TemplateCarousel = ({ templates, onSelectTemplate, activeTemplateId, appliedTemplateId }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 3; // Approximate cards visible at once
  const totalPages = Math.ceil(templates.length / cardsPerPage);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      
      // Calculate current page for dots
      const cardWidth = 360; // card width + gap
      const page = Math.round(scrollLeft / (cardWidth * cardsPerPage));
      setCurrentPage(Math.min(page, totalPages - 1));
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [templates, totalPages]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 360; // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToPage = (pageIndex) => {
    if (scrollRef.current) {
      const cardWidth = 360;
      scrollRef.current.scrollTo({
        left: pageIndex * cardWidth * cardsPerPage,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      {/* Carousel container with arrows inside */}
      <div className="relative group/carousel">
        {/* Left Arrow - Always visible on desktop */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`
            hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 
            w-11 h-11 bg-white rounded-full shadow-lg border border-gray-200
            items-center justify-center transition-all duration-200
            ${canScrollLeft 
              ? 'hover:bg-gray-50 hover:shadow-xl hover:scale-105 cursor-pointer' 
              : 'opacity-40 cursor-not-allowed'
            }
          `}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow - Always visible on desktop */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`
            hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 
            w-11 h-11 bg-white rounded-full shadow-lg border border-gray-200
            items-center justify-center transition-all duration-200
            ${canScrollRight 
              ? 'hover:bg-gray-50 hover:shadow-xl hover:scale-105 cursor-pointer' 
              : 'opacity-40 cursor-not-allowed'
            }
          `}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Gradient masks */}
        <div className={`
          hidden md:block absolute left-0 top-0 bottom-0 w-20 
          bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none
          transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}
        `} />
        <div className={`
          hidden md:block absolute right-0 top-0 bottom-0 w-20 
          bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none
          transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-1 -mx-1 snap-x snap-mandatory md:snap-none md:px-14"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {templates.map((template) => (
            <div key={template.id} className="snap-start">
              <TemplateCard
                template={template}
                onClick={onSelectTemplate}
                isActive={activeTemplateId === template.id}
                isApplied={appliedTemplateId === template.id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index)}
              className={`
                transition-all duration-200 rounded-full
                ${currentPage === index 
                  ? 'w-6 h-2 bg-gray-800' 
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }
              `}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
// Category filter data
const categories = [
  { id: 'all', label: 'All' },
  { id: 'Project Management', label: 'Project Management' },
  { id: 'CRM', label: 'CRM' },
  { id: 'ERP', label: 'ERP' },
  { id: 'ATS & Recruiting', label: 'ATS & Recruiting' },
  { id: 'Customer Support', label: 'Support' },
  { id: 'AI Meeting Assistant', label: 'AI Meeting' },
];

const CategoryFilter = ({ selectedCategory, onSelectCategory, availableCategories }) => {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const filteredCategories = categories.filter(
    cat => cat.id === 'all' || availableCategories.includes(cat.id)
  );

  return (
    <div className="relative mb-6">
      {/* Left fade */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right fade */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable pills */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {filteredCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${selectedCategory === cat.id 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ClariooLandingV3 = () => {
  const [companyContext, setCompanyContext] = useState('');
  const [solutionNeed, setSolutionNeed] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Animation states
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState(null);
  const [glowColor, setGlowColor] = useState(null);
  const [inputsGlowing, setInputsGlowing] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  
  const heroRef = useRef(null);
  const companyInputRef = useRef(null);

  const handleSelectTemplate = (template) => {
    // Reset previous applied state
    setAppliedTemplateId(null);
    
    // 1. Activate card with glow
    setActiveTemplateId(template.id);
    setGlowColor(template.glowColor);
    
    // 2. Scroll to Hero after brief delay
    setTimeout(() => {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    
    // 3. Activate inputs glow (synced with card)
    setTimeout(() => {
      setInputsGlowing(true);
    }, 400);
    
    // 4. Fade in text
    setTimeout(() => {
      setCompanyContext(template.inputCompany);
      setSolutionNeed(template.inputNeed);
      setTextVisible(true);
    }, 600);
    
    // 5. Remove glow, show applied state
    setTimeout(() => {
      setActiveTemplateId(null);
      setInputsGlowing(false);
      setAppliedTemplateId(template.id);
      setGlowColor(null);
    }, 1200);
    
    // 6. Reset text visible for next animation
    setTimeout(() => {
      setTextVisible(false);
      companyInputRef.current?.focus();
    }, 1400);
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // Dynamic glow style for inputs
  const inputGlowStyle = inputsGlowing && glowColor ? {
    boxShadow: `0 0 0 2px ${glowColor}, 0 0 20px ${glowColor}40`,
    borderColor: 'transparent'
  } : {};

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero - Clarioo style */}
      <section ref={heroRef} className="bg-gradient-to-b from-blue-50/50 to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          {/* Logo */}
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl mb-8">
            <span className="text-white font-bold text-xl">Clarioo</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Software Discovery &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Selection Co-pilot
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Streamline "Needs-to-Decision" buying journey with expert AI and automate 90% of manual work
          </p>

          {/* Input Section */}
          <div 
            className="gap-4 mb-6 text-left"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
            }}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tell me more about you and your company
              </label>
              <textarea
                ref={companyInputRef}
                value={companyContext}
                onChange={(e) => setCompanyContext(e.target.value)}
                placeholder="e.g., We are a digital marketing agency with 45 employees based in Europe..."
                className={`
                  w-full h-28 p-4 text-sm bg-white border border-gray-200 rounded-xl resize-none 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  placeholder:text-gray-400 transition-all duration-300 shadow-sm
                  ${textVisible ? 'animate-fadeIn' : ''}
                `}
                style={inputGlowStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Feel free to give examples or specify your need
              </label>
              <textarea
                value={solutionNeed}
                onChange={(e) => setSolutionNeed(e.target.value)}
                placeholder="e.g., We use Trello and Google Sheets but it's chaos. We need resource planning..."
                className={`
                  w-full h-28 p-4 text-sm bg-white border border-gray-200 rounded-xl resize-none 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  placeholder:text-gray-400 transition-all duration-300 shadow-sm
                  ${textVisible ? 'animate-fadeIn' : ''}
                `}
                style={inputGlowStyle}
              />
            </div>
          </div>
          
          {/* CTA Button - Gradient style */}
          <button 
            className={`
              inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg
              ${companyContext || solutionNeed
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
            disabled={!companyContext && !solutionNeed}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Explore with Clarioo
          </button>
        </div>
      </section>

      {/* Templates Section - Carousel */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Or start from a template
          </h2>
          <p className="text-sm text-gray-500">
            Common scenarios with pre-built evaluation criteria
          </p>
        </div>

        {/* Category Filter - Scrollable pills */}
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          availableCategories={[...new Set(templates.map(t => t.category))]}
        />

        {/* Template Carousel */}
        <TemplateCarousel 
          templates={filteredTemplates}
          onSelectTemplate={handleSelectTemplate}
          activeTemplateId={activeTemplateId}
          appliedTemplateId={appliedTemplateId}
        />

        {/* Footer hint */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Templates are starting points — customize them to match your situation
          </p>
        </div>
      </section>

      {/* Next Section Teaser */}
      <section className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          See Every Step of the Process
        </h2>
      </section>

      {/* Global styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0.3;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ClariooLandingV3;
