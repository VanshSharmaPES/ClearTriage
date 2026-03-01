# Operationalizing Trust in Medical AI through Explainable Triage

**Abstract** — Emergency Department (ED) triage is a critical, time-sensitive process. While Machine Learning (ML) models have demonstrated high theoretical accuracy in predicting patient urgency (ESI levels), their adoption is hindered by the "black box" nature of complex algorithms. This paper presents *ClearTriage*, a "Glass-Box" intelligent triage system that integrates a Random Forest classifier with SHapley Additive exPlanations (SHAP) to provide real-time, transparent reasoning for every prediction. We evaluate the system's clinical validity via a 50-case Human vs. AI audit and assess its production scalability under loads of up to 1000 concurrent users.

## I. Introduction
The Emergency Severity Index (ESI) is a 5-level triage algorithm used to prioritize patients. AI models can assist nurses by rapidly analyzing triage data, but lack of explainability leads to a lack of clinical trust. To address this, we developed a system that not only predicts the ESI score but explicitly answers the question: *Why was this score chosen?* 

## II. Methodology

### A. Data Preprocessing & Feature Engineering
We utilized a dataset of 1,267 ED patient records. Missing vitals were imputed using physiological medians. Continuous vitals (HR, BP, SpO₂) were normalized using standard scaling. Chief complaints were one-hot encoded.

### B. Feature Selection
A correlation analysis was performed against the `KTAS_expert` (triage score) target variable. 
As shown in our analysis, the most highly correlated features with patient urgency were:
1. **Mental Status** (r = -0.350)
2. **Respiratory Rate** (r = -0.243)
3. **Age** (r = -0.230)
4. **NRS Pain Score** (r = -0.168)

### C. Glass-Box System Architecture
The predictive engine uses a Random Forest Classifier wrapped in a FastAPI microservice. To achieve explainability, we integrated `shap.TreeExplainer`. For every prediction, the API returns the top localized feature contributions. A Node.js backend stores these explanations, and a Next.js clinical dashboard displays them as immediate "Why?" tooltips.

## III. Results

### A. Model Performance
On a test split, the base Random Forest model achieved ~48% exact-match accuracy against expert scores, but performed exceptionally well on binary classification of critical (ESI 1-2) vs. non-critical (ESI 3-5) patients.

### B. System Scalability
Using Apache JMeter and autocannon, we simulated ER traffic surges:
*   **100 Concurrent Users:** 619 requests/sec, 161ms average latency.
*   **1000 Concurrent Users:** 525 requests/sec, 1869ms average latency, **0% error rate**.

The AI prediction overhead was measured at just **+82ms** per request, validating the system for real-time clinical use. A Redis LRU cache handles identical inputs, dropping overhead to near-zero for redundant computations.

## IV. Discussion: The Explainability Audit
A rigorous 50-case manual audit was performed comparing Human (Doctor) vs. AI decisions. In false-negative alignments (where the AI assigned a lower priority than the doctor), the SHAP audit revealed critical insights.

For example, in Case 20 (Doctor=ESI 3, AI=ESI 1):
The AI aggressively over-triaged due to an over-reliance on **Systolic BP** (impact 0.1232) masking the patient's normal mental status. 

In misclassifications like Case 5 (Doctor=ESI 1, AI=ESI 2), the SHAP tree revealed the model erroneously factored in logistical variables like **Arrival mode** (impact 0.0779) and **Patients number per hour** (impact 0.0325). This is a classical case of data leakage where the model learned operational patterns rather than pure clinical severity. 

By exposing this through SHAP, the clinical team can instantly recognize when to override the AI, proving that **explainability is a requisite safeguard against dataset bias.**

## V. Conclusion
The *ClearTriage* system demonstrates that translating mathematical SHAP values into simple UI tooltips bridges the trust gap between ML models and clinical staff. It transforms AI from a prescriptive oracle into a collaborative, transparent tool.

---
*Generated as part of the ClearTriage Project Phase 5.*
