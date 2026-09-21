# ⚖️ BMI Calculator & Health Tracker  +  📈 CalculusLab

This repository hosts **two GitHub Pages sites** at the same URL:

| Page | URL | Description |
| :--- | :--- | :--- |
| ⚖️ **BMI Calculator** | [`/`](https://411514326-arch.github.io/bmi-calculator/) | Body Mass Index calculator with visual gauge & healthy range |
| 📈 **CalculusLab** | [`/calculus/`](https://411514326-arch.github.io/bmi-calculator/calculus/) | Interactive calculus visualizer (Derivatives, Integrals, Taylor Series, Limits) |

---

## 🚀 Live Sites on GitHub Pages

- **BMI Calculator** → **https://411514326-arch.github.io/bmi-calculator/**
- **CalculusLab** → **https://411514326-arch.github.io/bmi-calculator/calculus/**

> To enable GitHub Pages: **Settings → Pages → Branch: main → Folder: / (root) → Save**

---

## ⚖️ BMI Calculator Features

- **Dual Unit Support**: Metric (cm / kg) and Imperial (ft·in / lbs)
- **Interactive Visual Gauge**: Color-coded WHO standard spectrum
- **Healthy Weight Target**: Optimal weight range for your height
- **Weight Difference Indicator**: Shows kg/lbs needed to reach healthy range
- **Python CLI Tool**: `python bmi_calculator.py`

---

## 📈 CalculusLab — Interactive Modules

### 1. Derivatives & Tangent Lines
- Drag point *x₀* on the graph or use the slider
- **"Animate h → 0"** shows the secant line morphing into the tangent
- Overlay derivative curve *f'(x)* dynamically

### 2. Definite Integrals & Riemann Sums
- 5 methods: Left, Right, Midpoint, Trapezoidal, Simpson's Rule
- Drag integration bounds *a* and *b* directly on the x-axis
- **"Animate n: 1 → 50"** shows convergence live
- Real-time error % vs. exact integral

### 3. Taylor & Maclaurin Polynomials
- Degree slider *n* ∈ [0, 15] with step/play animation
- Presets: sin(x), cos(x), eˣ, ln(1+x), 1/(1-x), arctan(x)
- Drag expansion center *a* on the canvas

### 4. Limits & ε-δ Explorer
- Visual horizontal ε-band and vertical δ-band
- Detects removable singularities (open-circle holes)
- Shows left and right one-sided limits

### 5. Function Explorer (Sandbox)
- Custom expression input with math.js parsing
- Auto-detects roots, local extrema, and inflection points
- Toggle f(x), f'(x), f''(x) layers simultaneously
- Export graph as PNG

---

## 🛠️ Project Structure

```
.
├── index.html              # ⚖️ BMI Calculator (root page)
├── style.css               # BMI styles
├── app.js                  # BMI logic
├── bmi_calculator.py       # Python CLI version
├── calculus/
│   ├── index.html          # 📈 CalculusLab main page
│   ├── style.css           # CalculusLab styles (dark/light theme)
│   ├── app.js              # CalculusLab controller + KaTeX rendering
│   ├── calc-engine.js      # Numerical calculus algorithms
│   └── calc-graph.js       # 2D Canvas graphing engine (pan, zoom, drag)
└── README.md
```

---

## 💻 Running Locally

Open `index.html` (BMI) or `calculus/index.html` (CalculusLab) directly in any web browser. No build step required!
