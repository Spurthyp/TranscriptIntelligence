import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  TrendingUp,
  Compass,
  GitBranch,
  Search,
  ChevronRight,
  X,
  Play,
  CheckCircle2,
  BarChart3,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('categories');
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected Category for Visualizer
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('Compliance & Audit Readiness');

  // Filters for Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCallType, setSelectedCallType] = useState('');
  const [selectedChurnRisk, setSelectedChurnRisk] = useState('');

  // Selected Transcript Modal
  const [selectedTranscriptDetail, setSelectedTranscriptDetail] = useState(null);

  // Pipeline Live Execution State
  const [agentRunning, setAgentRunning] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sumRes, catRes, trRes, insRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/categories'),
        fetch('/api/transcripts'),
        fetch('/api/insights')
      ]);

      const sumData = await sumRes.json();
      const catData = await catRes.json();
      const trData = await trRes.json();
      const insData = await insRes.json();

      const sortedCatData = (catData || []).sort((a, b) => b.count - a.count);
      setSummary(sumData);
      setCategories(sortedCatData);
      setTranscripts(trData);
      setInsights(insData);
      if (sortedCatData && sortedCatData.length > 0) {
        setSelectedCategoryKey(sortedCatData[0].name);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTranscript = async (id) => {
    try {
      const res = await fetch(`/api/transcripts/${id}`);
      const data = await res.json();
      setSelectedTranscriptDetail(data);
    } catch (err) {
      console.error('Failed to load transcript detail:', err);
    }
  };

  const handleRunLiveAgentForTranscript = async (id) => {
    try {
      setAgentRunning(true);
      const res = await fetch(`/api/pipeline/run/${id}`, {
        method: 'POST'
      });
      const data = await res.json();
      setSelectedTranscriptDetail(prev => ({
        ...prev,
        category: data.category,
        category_confidence: data.confidence,
        category_reasoning: data.reasoning,
        sentiment_label: data.sentiment,
        sentiment_score: data.sentiment_score,
        churn_risk: data.churn_risk,
        pipeline_trace: data.pipeline_trace,
        stakeholder_insights: data.stakeholder_insights,
        live_ran: true
      }));
    } catch (err) {
      console.error('Failed to run agent pipeline:', err);
    } finally {
      setAgentRunning(false);
    }
  };

  const categoryColorMap = {
    'Compliance & Audit Readiness': '#2563eb',
    'Incident & Outage Management': '#dc2626',
    'Technical Support': '#d97706',
    'Commercials & Renewals': '#7c3aed',
    'Product Strategy, Roadmap & Internal Operations': '#059669',
    'Customer Onboarding': '#0891b2',
    // Fallback aliases
    'Technical Support & Troubleshooting': '#d97706',
    'Commercials, Renewals & Churn Risk': '#7c3aed',
    'Customer Onboarding & Deployment': '#0891b2'
  };

  // Matrix distribution data (Category x Channel)
  const channelMatrix = [
    { category: 'Compliance & Audit Readiness', external: 20, internal: 10, support: 8, total: 38, color: '#2563eb' },
    { category: 'Incident & Outage Management', external: 16, internal: 16, support: 5, total: 37, color: '#dc2626' },
    { category: 'Technical Support', external: 1, internal: 2, support: 9, total: 12, color: '#d97706' },
    { category: 'Commercials & Renewals', external: 3, internal: 1, support: 5, total: 9, color: '#7c3aed' },
    { category: 'Product Strategy & Roadmap', external: 2, internal: 1, support: 0, total: 3, color: '#059669' },
    { category: 'Customer Onboarding', external: 1, internal: 0, support: 0, total: 1, color: '#0891b2' }
  ];

  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);
  const currentCategoryObj = sortedCategories.find(c => c.name === selectedCategoryKey) || sortedCategories[0];

  const filteredTranscripts = transcripts.filter((t) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (selectedCallType && t.call_type !== selectedCallType) return false;
    if (selectedChurnRisk && t.churn_risk !== selectedChurnRisk) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchCustomer = t.customer_name?.toLowerCase().includes(q);
      const matchSummary = t.summary?.toLowerCase().includes(q);
      const matchTopics = t.topics?.some(top => top.toLowerCase().includes(q));
      if (!matchTitle && !matchCustomer && !matchSummary && !matchTopics) return false;
    }
    return true;
  });

  return (
    <div className="app-container">
      {/* Clean Enterprise Header */}
      <header className="app-header">
        <div className="brand-section">
          <div>
            <h1 className="brand-title">Transcript Intelligence</h1>
            <p className="brand-subtitle">Aegis Cloud Enterprise</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <BarChart3 size={15} />
            Categories & Visuals
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'transcripts' ? 'active' : ''}`}
            onClick={() => setActiveTab('transcripts')}
          >
            <FileText size={15} />
            Transcript Explorer
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'sentiment' ? 'active' : ''}`}
            onClick={() => setActiveTab('sentiment')}
          >
            <TrendingUp size={15} />
            Sentiment Analysis
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <Compass size={15} />
            Stakeholder Insights
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            Loading dataset...
          </div>
        ) : (
          <>
            {/* TAB 1: CATEGORIES & GRAPHICAL VISUALS */}
            {activeTab === 'categories' && (
              <div>
                {/* Top Metric Bar - Executive Snapshot */}
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Dataset Size</div>
                    <div className="metric-value">{summary?.total_transcripts || 100}</div>
                    <div className="metric-subtext">Call transcripts analyzed</div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Categories</div>
                    <div className="metric-value">{categories.length || 6}</div>
                    <div className="metric-subtext">Core operational themes</div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Average Sentiment</div>
                    <div className="metric-value">
                      {transcripts.length > 0
                        ? (transcripts.reduce((acc, t) => acc + (Number(t.sentiment_score) || 0), 0) / transcripts.length).toFixed(2)
                        : '3.42'}
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/5.0</span>
                    </div>
                    <div className="metric-subtext">Support, AM, & Engineering</div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">Critical Churn Risk</div>
                    <div className="metric-value" style={{ color: '#dc2626' }}>
                      {summary?.churn_risk_distribution?.['Critical']
                        ? `${Math.round((summary.churn_risk_distribution['Critical'] / (summary.total_transcripts || 100)) * 100)}%`
                        : '52%'}
                    </div>
                    <div className="metric-subtext">Accounts with churn signals</div>
                  </div>
                </div>
                <div className="section-header">
                  <h2 className="section-title">Category Breakdown & Distribution</h2>
                  <p className="section-subtitle">
                    Visual distribution of the 100 transcripts across identified business categories and communication channels.
                  </p>
                </div>

                {/* 1. Top Graphic: 100% Stacked Proportional Distribution Bar */}
                <div className="clean-card" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                      Call Distribution
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Total Volume: 100%
                    </span>
                  </div>

                  <div className="stacked-progress-container">
                    {sortedCategories.map((c, i) => (
                      <div
                        key={i}
                        className="stacked-segment"
                        style={{
                          width: `${c.count}%`,
                          backgroundColor: categoryColorMap[c.name] || '#64748b',
                          cursor: 'pointer'
                        }}
                        title={`${c.name}: ${c.count}% (${c.count} calls)`}
                        onClick={() => setSelectedCategoryKey(c.name)}
                      />
                    ))}
                  </div>

                  {/* Chart Legend */}
                  <div className="chart-legend">
                    {sortedCategories.map((c, i) => (
                      <div
                        key={i}
                        className="legend-item"
                        style={{ cursor: 'pointer', fontWeight: selectedCategoryKey === c.name ? 600 : 400 }}
                        onClick={() => setSelectedCategoryKey(c.name)}
                      >
                        <div className="legend-dot" style={{ backgroundColor: categoryColorMap[c.name] || '#64748b' }} />
                        <span>{c.name} ({c.count}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Two-Column Visualizer: Volume Bar List + Active Category Inspector */}
                <div className="visualizer-grid">
                  {/* Left Column: Visual Bar Rows */}
                  <div className="clean-card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>
                      Call Volume by business
                    </h3>

                    {sortedCategories.map((c, idx) => {
                      const isSelected = selectedCategoryKey === c.name;
                      const color = categoryColorMap[c.name] || '#2563eb';
                      return (
                        <div
                          key={idx}
                          className={`category-bar-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCategoryKey(c.name)}
                        >
                          <div style={{ minWidth: '150px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? '#0f172a' : '#334155' }}>
                              {c.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {c.count} calls ({c.count}%)
                            </div>
                          </div>

                          <div className="bar-fill-track">
                            <div
                              className="bar-fill"
                              style={{ width: `${(c.count / 40) * 100}%`, backgroundColor: color }}
                            />
                          </div>

                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: color, minWidth: '35px', textAlign: 'right' }}>
                            {c.count}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Active Category Details & Sample Transcripts */}
                  <div className="clean-card" style={{ borderLeft: `4px solid ${categoryColorMap[currentCategoryObj?.name] || '#2563eb'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                        {currentCategoryObj?.name}
                      </h3>
                      <span className="badge badge-am" style={{ fontSize: '0.75rem' }}>
                        {currentCategoryObj?.count} Transcripts
                      </span>
                    </div>

                    <div style={{ margin: '0.75rem 0', background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.2rem' }}>
                        Reason for this Category
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                        {currentCategoryObj?.reasoning}
                      </p>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Sample Transcripts in Category
                      </div>

                      {currentCategoryObj?.sample_transcripts?.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="category-sample-item"
                          onClick={() => handleOpenTranscript(s.id)}
                          title="Click to view full transcript dialogue"
                        >
                          <div>
                            <div className="category-sample-title">{s.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                              ID: {s.id.substring(0, 8)}... | {s.customer_name || 'Internal'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <span className={`badge ${s.call_type === 'Customer Support' ? 'badge-support' :
                              s.call_type === 'External AM / CS' ? 'badge-am' : 'badge-internal'
                              }`}>
                              {s.call_type}
                            </span>
                            <ExternalLink size={13} color="#94a3b8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Graphic: Category x Channel Cross-Tabulation Heatmap Table */}
                <div className="clean-card" style={{ marginTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.2rem' }}>
                    Category x Channel Distribution Matrix
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    Shows where each business theme surfaces across operational customer communication channels.
                  </p>

                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th style={{ textAlign: 'center' }}>External AM / CS (43)</th>
                        <th style={{ textAlign: 'center' }}>Internal Engineering (30)</th>
                        <th style={{ textAlign: 'center' }}>Customer Support (27)</th>
                        <th style={{ textAlign: 'right' }}>Total Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelMatrix.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td style={{ fontWeight: 500, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }} />
                              {row.category}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="matrix-cell-badge" style={{ backgroundColor: row.external > 0 ? '#e0f2fe' : '#f8fafc', color: row.external > 0 ? '#0369a1' : '#94a3b8' }}>
                              {row.external}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="matrix-cell-badge" style={{ backgroundColor: row.internal > 0 ? '#f3e8ff' : '#f8fafc', color: row.internal > 0 ? '#6b21a8' : '#94a3b8' }}>
                              {row.internal}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="matrix-cell-badge" style={{ backgroundColor: row.support > 0 ? '#fef3c7' : '#f8fafc', color: row.support > 0 ? '#92400e' : '#94a3b8' }}>
                              {row.support}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                            {row.total} calls
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSCRIPT EXPLORER */}
            {activeTab === 'transcripts' && (
              <div>
                <div className="section-header">
                  <h2 className="section-title">Transcript Explorer</h2>
                  <p className="section-subtitle">
                    Search and filter across all 100 enterprise transcripts. Click any row to review full turn-by-turn dialogue, key moments, and action items.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="filter-bar">
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      className="search-input"
                      style={{ paddingLeft: '2.2rem' }}
                      placeholder="Search by title, customer, or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="select-dropdown"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories ({categories.length})</option>
                    {categories.map((c, i) => (
                      <option key={i} value={c.name}>{c.name} ({c.count})</option>
                    ))}
                  </select>

                  <select
                    className="select-dropdown"
                    value={selectedCallType}
                    onChange={(e) => setSelectedCallType(e.target.value)}
                  >
                    <option value="">All Call Types</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="External AM / CS">External AM / CS</option>
                    <option value="Internal Engineering & Exec">Internal Engineering & Exec</option>
                  </select>

                  <select
                    className="select-dropdown"
                    value={selectedChurnRisk}
                    onChange={(e) => setSelectedChurnRisk(e.target.value)}
                  >
                    <option value="">All Churn Risk Levels</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  {(selectedCategory || selectedCallType || selectedChurnRisk || searchQuery) && (
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedCallType('');
                        setSelectedChurnRisk('');
                        setSearchQuery('');
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Clean Table */}
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Meeting / Title</th>
                        <th>Call Channel</th>
                        <th>Category</th>
                        <th>Products</th>
                        <th>Sentiment</th>
                        <th>Churn Risk</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTranscripts.map((t) => (
                        <tr key={t.id} onClick={() => handleOpenTranscript(t.id)}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.title}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                              {t.customer_name ? `Client: ${t.customer_name}` : 'Internal'} | ID: {t.id.substring(0, 8)}...
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${t.call_type === 'Customer Support' ? 'badge-support' :
                              t.call_type === 'External AM / CS' ? 'badge-am' : 'badge-internal'
                              }`}>
                              {t.call_type}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                            {t.category}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                              {t.product_lines?.map((p, pi) => (
                                <span key={pi} style={{ fontSize: '0.68rem', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${t.sentiment_label.includes('positive') ? 'badge-pos' :
                              t.sentiment_label.includes('mixed-pos') ? 'badge-mixed-pos' :
                                t.sentiment_label.includes('mixed-neg') ? 'badge-mixed-neg' : 'badge-neg'
                              }`}>
                              {t.sentiment_score}/5.0
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${t.churn_risk === 'Critical' ? 'churn-critical' :
                              t.churn_risk === 'High' ? 'churn-high' :
                                t.churn_risk === 'Medium' ? 'churn-medium' : 'churn-low'
                              }`}>
                              {t.churn_risk}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {t.duration ? `${t.duration}m` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SENTIMENT ANALYSIS (TASK 2) */}
            {activeTab === 'sentiment' && (
              <div>
                <div className="section-header">
                  <h2 className="section-title">Sentiment Analysis Across Call Types</h2>
                  <p className="section-subtitle">
                    Comparison across call channels, trend identification, and what the metrics mean for leadership.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="clean-card" style={{ borderTop: '3px solid #0284c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>External AM / CS Calls</h3>
                      <span className="badge badge-am">43 Calls</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7', margin: '0.35rem 0' }}>
                      3.71 <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>/ 5.0 Avg</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                      <strong>Trend Dynamic:</strong> High variance. Accounts adopting Comply v2 or in audit cycles reported high satisfaction (4.8+), while accounts impacted by the Detect outage dropped to critical satisfaction levels (1.6 - 2.4).
                    </p>
                  </div>

                  <div className="clean-card" style={{ borderTop: '3px solid #7c3aed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Internal Engineering & Exec</h3>
                      <span className="badge badge-internal">30 Calls</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7c3aed', margin: '0.35rem 0' }}>
                      3.42 <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>/ 5.0 Avg</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                      <strong>Trend Dynamic:</strong> Highly objective and blameless. War rooms during the active outage maintained disciplined problem-solving, quickly pivoting to long-term circuit breakers and active-active architectures.
                    </p>
                  </div>

                  <div className="clean-card" style={{ borderTop: '3px solid #d97706' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Customer Support Calls</h3>
                      <span className="badge badge-support">27 Calls</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', margin: '0.35rem 0' }}>
                      2.94 <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>/ 5.0 Avg</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                      <strong>Trend Dynamic:</strong> Lowest sentiment across the organization. Support engineers face repetitive friction regarding S3 403 permission errors, LogVault timeouts, and customer frustration over delayed incident notices.
                    </p>
                  </div>
                </div>

                {/* Trend Insights */}
                <div className="clean-card">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.85rem' }}>
                    What These Trends Mean for Leadership
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>
                        1. Outage Directly Transmits to Churn Risk
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.5' }}>
                        The 6-hour loss of threat visibility triggered churn signals in 52% of accounts. Regulated customers (e.g. Blackridge Investments, Northstar Pharma) are bound by HIPAA and SOC 2 audits, making an unannounced blackout a regulatory breach.
                      </p>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                        2. Comply v2 is Aegis's Highest-Leverage Asset
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.5' }}>
                        Compliance calls average 3.93/5.0 sentiment. Customers are eager for automated multi-framework evidence export. Accelerating Comply v2 adoption can offset churn risk by embedding Aegis deeply into annual audit workflows.
                      </p>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>
                        3. Support Suffers from External Communication Lag
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.5' }}>
                        Support sentiment suffers primarily because customers notice outages before Aegis updates status pages. Support agents spend early call minutes de-escalating customer confusion rather than resolving technical tickets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STAKEHOLDER INSIGHTS (TASK 3) */}
            {activeTab === 'insights' && (
              <div>
                <div className="section-header">
                  <h2 className="section-title">Stakeholder Insights & Non-Obvious Discoveries</h2>
                  <p className="section-subtitle">
                    Actionable discoveries tailored for distinct leadership roles across Aegis Cloud.
                  </p>
                </div>

                <div className="stakeholder-grid">
                  {insights?.stakeholders.map((sh, sIdx) => {
                    const cardClass =
                      sIdx === 0 ? "stakeholder-card stakeholder-card-eng" :
                        sIdx === 1 ? "stakeholder-card stakeholder-card-sup" :
                          sIdx === 2 ? "stakeholder-card stakeholder-card-sales" :
                            "stakeholder-card stakeholder-card-prod";
                    return (
                      <div key={sIdx} className={cardClass}>
                        <div>
                          <div className="stakeholder-header">
                            <h3 className="stakeholder-title">{sh.role}</h3>
                            <span className="stakeholder-badge">{sh.focus}</span>
                          </div>

                          <div className="stakeholder-section">
                            <div className="stakeholder-section-label">
                              Key Empirical Findings
                            </div>
                            <ul className="findings-list">
                              {sh.key_findings.map((f, fi) => (
                                <li key={fi}>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="stakeholder-section-label action-label">
                            Recommended Actions
                          </div>
                          <ul className="actions-list">
                            {sh.action_items.map((act, ai) => (
                              <li key={ai}>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* DETAIL MODAL / DRAWER */}
      {selectedTranscriptDetail && (
        <div className="modal-overlay" onClick={() => setSelectedTranscriptDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 600 }}>
                  {selectedTranscriptDetail.title}
                </h3>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span className={`badge ${selectedTranscriptDetail.call_type === 'Customer Support' ? 'badge-support' :
                    selectedTranscriptDetail.call_type === 'External AM / CS' ? 'badge-am' : 'badge-internal'
                    }`}>
                    {selectedTranscriptDetail.call_type}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    ID: {selectedTranscriptDetail.id} | {selectedTranscriptDetail.duration} mins
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedTranscriptDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Summary */}
              <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Summary & Classification
                </div>
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                  {selectedTranscriptDetail.summary}
                </p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-pos">Category: {selectedTranscriptDetail.category}</span>
                  <span className={`badge ${selectedTranscriptDetail.churn_risk === 'Critical' ? 'churn-critical' : 'churn-low'}`}>
                    Churn Risk: {selectedTranscriptDetail.churn_risk}
                  </span>
                  <span className="badge badge-mixed-pos">
                    Sentiment: {selectedTranscriptDetail.sentiment_label} ({selectedTranscriptDetail.sentiment_score}/5.0)
                  </span>
                </div>
              </div>

              {/* Live LangGraph Agent Pipeline Card (Option 2: On-Demand) */}
              <div style={{
                marginBottom: '1.25rem',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <GitBranch size={16} color="#2563eb" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        LangGraph Agent Pipeline
                      </span>
                      {selectedTranscriptDetail.live_ran && (
                        <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          ● Live Evaluated
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {selectedTranscriptDetail.live_ran
                        ? 'Execution completed across all 5 autonomous nodes in the LangGraph state machine.'
                        : 'Test the live state machine: executes the 5-node agent pipeline on this transcript in real-time.'}
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => handleRunLiveAgentForTranscript(selectedTranscriptDetail.id)}
                    disabled={agentRunning}
                  >
                    <Play size={12} />
                    {agentRunning ? 'Executing 5-Node Graph...' : selectedTranscriptDetail.live_ran ? '⚡ Re-run Agent Graph' : '⚡ Execute Agent Graph'}
                  </button>
                </div>

                {/* Only show the reasoning and 5-node trace if the user triggered the live agent (or while running) */}
                {(selectedTranscriptDetail.live_ran || agentRunning) && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
                    {agentRunning ? (
                      <div style={{ padding: '0.85rem', textAlign: 'center', color: '#2563eb', fontSize: '0.82rem', fontWeight: 500 }}>
                        Executing 5-node LangGraph pipeline in real-time...
                      </div>
                    ) : (
                      <>
                        {/* Justification Reasoning */}
                        {selectedTranscriptDetail.category_reasoning && (
                          <div style={{ fontSize: '0.8rem', color: '#334155', background: '#ffffff', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Agent Classification Reasoning:</span>
                              {selectedTranscriptDetail.category_confidence && (
                                <span style={{ color: '#166534' }}>
                                  {(selectedTranscriptDetail.category_confidence * 100).toFixed(0)}% Confidence
                                </span>
                              )}
                            </div>
                            <div>{selectedTranscriptDetail.category_reasoning}</div>
                          </div>
                        )}

                        {/* Execution Trace Steps */}
                        {selectedTranscriptDetail.pipeline_trace?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                              Execution Audit Trail ({selectedTranscriptDetail.pipeline_trace.length} State Nodes):
                            </div>
                            <div className="agent-step-list">
                              {selectedTranscriptDetail.pipeline_trace.map((tr, tIdx) => (
                                <div key={tIdx} className="agent-step-item">
                                  <CheckCircle2 size={13} color="#16a34a" />
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1e40af', minWidth: '170px', fontSize: '0.76rem' }}>
                                    {tr.node}
                                  </span>
                                  <span style={{ color: '#475569', fontSize: '0.78rem' }}>{tr.details}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Items */}
              {selectedTranscriptDetail.action_items?.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Action Items ({selectedTranscriptDetail.action_items.length})
                  </div>
                  {selectedTranscriptDetail.action_items.map((act, aIdx) => (
                    <div key={aIdx} className="key-moment-pill">
                      ✓ {act}
                    </div>
                  ))}
                </div>
              )}

              {/* Turns */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Transcript Turns ({selectedTranscriptDetail.raw_turns?.length || 0})
                </div>
                {selectedTranscriptDetail.raw_turns?.map((turn, tIdx) => (
                  <div key={tIdx} className="dialogue-turn">
                    <div className="speaker-header">
                      <span className="speaker-name">{turn.speaker_name}</span>
                      <span className="speaker-time">{turn.time ? `${turn.time.toFixed(1)}s` : ''}</span>
                    </div>
                    <div className="turn-sentence">{turn.sentence}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
