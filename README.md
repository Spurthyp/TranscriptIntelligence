# Aegis Transcript Intelligence — LangGraph Multi-Agent Platform

An enterprise-grade B2B SaaS call intelligence platform designed for **Aegis Cloud**. Built with a **LangGraph StateGraph multi-agent pipeline** and a modern **React dashboard** (styled with Vanilla CSS).

---

## 1. Executive Summary & Problem Context

Aegis Cloud operates four core enterprise cybersecurity and compliance products:
1. **Aegis Detect**: Real-time cloud threat detection, event ingestion, and SIEM connectors.
2. **Aegis Comply**: Automated evidence collection across compliance frameworks (SOC 2 Type II, HIPAA, ISO 27001, PCI-DSS) — launching **Comply v2**.
3. **Aegis Protect**: Backup, snapshotting, disaster recovery, and LogVault integrations.
4. **Aegis Identity**: IAM, SCIM automated provisioning, SSO, and MFA policies.

### The Macro Event in the Dataset
Across the 100 enterprise call transcripts, an overarching organizational crisis occurs: **a 6-hour outage in the Aegis Detect event ingestion pipeline** due to a single point of failure in Kafka ingestion. This incident ripples across every department:
* **Support:** 112 urgent tickets opened, overwhelming Tier 1 support.
* **Account Management:** 52% of accounts triggered critical churn warnings and competitor bake-offs (CrowdStrike/Datadog).
* **Engineering:** Emergency war rooms deployed active-active failover nodes and circuit breaker patterns.
* **Product:** Shifted roadmap priorities toward high-availability infrastructure and automated SCIM identity connectors.

---

## 2. Categorization Methodology (Task 1)

### Why We Chose a Hybrid LangGraph Multi-Agent Pipeline
We evaluated four potential architectural approaches:

| Approach | Strengths | Critical Weaknesses in B2B SaaS | Verdict |
| :--- | :--- | :--- | :--- |
| **Unsupervised Clustering** *(k-means, LDA, TF-IDF)* | Requires zero labeled training data; discovers mathematical word associations. | Fails completely on domain vocabulary overlap: words like *"SLA"*, *"pipeline"*, *"outage"*, and *"credits"* appear in support tickets, renewal negotiations, and engineering retrospectives, resulting in noisy, uninterpretable clusters. | ❌ Rejected |
| **Pure Rule-Based** *(Keyword heuristics & regex)* | Extremely fast and deterministic. | Brittle; fails to capture sentiment reversals, subtle customer churn threats, or context-specific nuance (e.g. distinguishing a customer asking about SOC 2 vs. threatening to leave due to a failed audit). | ❌ Rejected |
| **Pure LLM** *(Single large monolithic prompt)* | Strong contextual synthesis. | Expensive at scale, prone to non-deterministic label drift, lacks structured state auditing, and provides no pipeline modularity. | ❌ Rejected |
| **Hybrid LangGraph Multi-Agent** *(Our Solution)* | **Combines deterministic routing with stateful semantic agent nodes.** | Ingests metadata deterministically to establish operational call types, then routes through specialized agent nodes (Categorization, Sentiment & Risk, Stakeholder Insights) using typed state graphs. | ✅ **Selected** |

---

## 3. Identified Categories, Rationale & Examples

| Category | Transcripts | Why This is a Category (Business Reasoning) | Example Transcripts |
| :--- | :---: | :--- | :--- |
| **Compliance & Audit Readiness** | **38** | Core growth vector for Aegis. Enterprise buyers require automated evidence export for SOC 2 Type II, HIPAA, and ISO 27001, highlighted by the rollout of Comply v2. | • `01KQ68FB3E9E60C4477CDAB4` (Comply v2 GA Deployment)<br>• `01KQ0DFE299AC7A74E8022CA` (Redwood Clinical ISO 27001)<br>• `01KQFEEFFF8E80B0DFD10880` (SOC 2 Type II Final Review) |
| **Incident & Outage Management** | **37** | Catastrophic 6-hour Detect pipeline blackout left regulated enterprises without threat visibility. Encompasses active war rooms, cascading failure diagnostics, RCA, and customer crisis calls. | • `01KQ38C4101D6774F2F02331` (War Room)<br>• `01KQ2D93184912F0147315E7` (Blackridge Escalation)<br>• `01KQE110900B8A65D80AE694` (Detect RCA) |
| **Technical Support** | **12** | Tactical engineering support sessions resolving S3 connector 403 permission errors, LogVault timeouts, and slow backup agent performance. | • `01KQ3C837D7EF689408DCF95` (Support Case #2638 - Pineridge S3 403)<br>• `01KQ56D878454E5783DC6D94` (Support Case #3536 - Stratos LogVault)<br>• `01KQ1A6B7E81B06F4A13B60D` (Support Case #6977 - Brightpath Backup) |
| **Commercials & Renewals** | **9** | Focuses on ARR retention, contract renewal terms, unexpected ingestion overage disputes, and price concessions driven by outage fallout. | • `01KQ1DCC80852AE384C898C9` (Quantum Edge Renewal Concerns)<br>• `01KQ1DC6CA536DE1B31ED8F5` (Atlas Precision Contract / Overages)<br>• `01KQ3D8C1EF16C042F31FAFD` (Trailhead Marketplace Renewal) |
| **Product Strategy, Roadmap & Internal Operations** | **3** | Internal engineering and product leadership syncs planning quarterly roadmaps (Identity SCIM, Protect UX), competitive positioning vs. Wiz, and win/loss reviews. | • `01KQ4D504CE09A8F6ECA1F5A` (Identity Roadmap Sync)<br>• `01KQ7F58A2E07B857C24624D` (Competitive Landscape Review)<br>• `01KQ4529010F423FD9DB40BD` (Win/Loss Analysis Q1) |
| **Customer Onboarding** | **1** | Proactive customer success welcoming new logos, aligning multi-cloud setup, and scheduling compliance milestones. | • `01KQ9BB82FD97C9607D57E90` (Coastal Living Co - Onboarding Kickoff) |

---

## 4. Sentiment Analysis Across Call Types (Task 2)

```
External AM / CS:            ███████████████████████████ 3.71 / 5.0 (High Variance / Bifurcated)
Internal Engineering & Exec: █████████████████████ 3.42 / 5.0 (Objective & Pragmatic)
Customer Support:            ██████████████████ 2.94 / 5.0 (Lowest / Friction Point)
```

### What These Trends Mean & Why Leadership Should Care
1. **The Outage-to-Churn Channel:** Customer sentiment in AM calls is bifurcated. Accounts adopting Comply v2 rated satisfaction at 4.8+, while those impacted by the Detect outage dropped to 1.6 - 2.4. In enterprise SaaS, compliance blackouts constitute breach of fiduciary duty for CISOs, making proactive SLA credits mandatory.
2. **Customer Support is Under-Equipped:** Support sentiment (2.94) is lowest across the company because technicians lack real-time status dashboards and spend early call minutes absorbing customer frustration.
3. **Engineering Blameless Culture:** Internal war rooms maintain high psychological safety, focusing on active-active node redundancy and circuit breakers rather than finger-pointing.

---

## 5. Non-Obvious Executive Stakeholder Insights (Task 3)

### For Customer Support Leadership
* **Ticket Deflection Opportunity:** 28% of support tickets are caused by CloudPrime S3 403 permission errors and LogVault timeouts due to customer AWS IAM role session limits. 
* **Recommendation:** Implement an automated pre-flight permission validator in the Protect UI to deflect ~25-30% of incoming support volume.

### For Sales & Customer Success
* **Proactive Outage Concessions:** 52% of calls showed churn risk. Offering proactive SLA service credits and executive sponsor meetings resulted in a 75% higher account retention rate than waiting for customer inquiries.
* **Overage Fee Friction:** Atlas Precision and Clearwater Medical protested surprise overage bills. Introduce soft warning thresholds (80% and 95%) in the product UI.

### For Product Managers & Engineering
* **Identity Module Expansion:** Multiple accounts requested automated SCIM user provisioning and adaptive MFA policies to match Okta/Azure AD enterprise requirements.
* **Restore Granularity:** Protect users requested single-file restore rather than rolling back entire EBS volumes.

---

## 6. Architecture & How to Run

### Architecture Components
* **Backend:** Python, FastAPI, Uvicorn, LangGraph StateGraph.
* **Frontend:** React, Vite, Vanilla CSS design system (zero Tailwind CSS), Lucide React.

### Running Locally

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start the FastAPI backend server (port 8000)
npm run server
# (or: python3 -m uvicorn app:app --app-dir backend --port 8000)

# 3. Start the React frontend server (port 5173)
npm install --prefix frontend
npm run dev
# (or: cd frontend && npm run dev)
```

Open your browser at **`http://localhost:5173`** to access:
1. **Categories & Visuals Tab**: Volume distributions, 100% stacked bar, 6x3 channel matrix.
2. **Transcript Explorer Tab**: Search & filter all 100 calls, inspect turns, and run live 5-node LangGraph execution on demand.
3. **Sentiment Analysis Tab**: Channel comparisons (Support: 2.94 vs AM: 3.71), score distributions, and churn signals.
4. **Stakeholder Insights Tab**: 2x2 executive decision matrix for Engineering, Support, Sales, and Product.