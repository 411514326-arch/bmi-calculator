# 📈 CalculusLab — Interactive Calculus Visualization & Graphing Platform

> An intuitive, interactive, and responsive web application designed to help students, educators, and math enthusiasts visualize and manipulate foundational concepts in Calculus.

Built with pure client-side HTML5, CSS3, and ES6 JavaScript. **100% ready for instant hosting on GitHub Pages** with zero build configuration!

---

## 🚀 Live Demo & Deployment to GitHub Pages

You can host this website directly on **GitHub Pages** in less than 1 minute:

1. On GitHub, navigate to: [https://github.com/411514326-arch/bmi-calculator/settings/pages](https://github.com/411514326-arch/bmi-calculator/settings/pages)
2. Under **Build and deployment** &gt; **Source**, choose **Deploy from a branch**.
3. Under **Branch**, select `main` and folder `/ (root)`.
4. Click **Save**.
5. Your website will be live at:  
   👉 **`https://411514326-arch.github.io/bmi-calculator/`**

---

## 🌟 Interactive Features & Calculus Modules

### 1. 📐 Derivatives & Tangent Lines
- **Secant-to-Tangent Transition**: Adjust the secant step $h$ and watch the secant line morph into the instantaneous tangent line as $h \to 0$.
- **"Animate $h \to 0$"**: Smooth real-time animation demonstrating $\lim_{h \to 0} \frac{f(x_0+h) - f(x_0)}{h} = f'(x_0)$.
- **Draggable Point $x_0$**: Click and drag the point of tangency directly along the curve on the canvas.
- **Trace Derivative $f'(x)$**: Overlay the derivative function curve dynamically.

### 2. 📊 Integrals & Riemann Sums
- **Interactive Partitioning**: Adjust the number of subintervals $n$ from $1$ up to $100$ with instant visual updates.
- **5 Approximation Methods**:
  - **Left Riemann Sum** ($L_n$)
  - **Right Riemann Sum** ($R_n$)
  - **Midpoint Rule** ($M_n$)
  - **Trapezoidal Rule** ($T_n$)
  - **Simpson's Rule** ($S_n$)
- **Draggable Bounds**: Drag bounds $a$ and $b$ directly on the x-axis.
- **Error Analysis**: Compares approximated area with the high-precision analytical integral and calculates percentage error ($\% \text{ Error}$).

### 3. 🎯 Taylor & Maclaurin Polynomials
- **Polynomial Approximation**: Explore how higher-degree polynomials $P_n(x)$ wrap around transcendental functions.
- **Step & Play Controls**: Auto-advance through degrees $n = 0 \to 15$.
- **Interactive Center Point $a$**: Drag or slide center $a$ to observe local convergence.
- **Real-Time KaTeX Formula**: Dynamically renders the full expanded polynomial series.
- **Presets**: $\sin(x), \cos(x), e^x, \ln(1+x), \frac{1}{1-x}, \arctan(x)$.

### 4. 🔍 Limits & $\varepsilon$-$\delta$ Explorer
- **Visual $\varepsilon$-$\delta$ Bands**: Demonstrates Cauchy's formal definition of a limit:
  $$\forall\,\varepsilon > 0, \; \exists\,\delta > 0 \quad\text{s.t.}\quad 0 < |x - c| < \delta \implies |f(x) - L| < \varepsilon$$
- **Discontinuity Detection**: Visualizes removable singularities (open circular holes), jump discontinuities, and vertical asymptotes.
- **One-Sided Limits**: Displays both $\lim_{x \to c^-} f(x)$ and $\lim_{x \to c^+} f(x)$.

### 5. 🧪 Function Explorer & Sandbox
- **Custom Expression Input**: Type any math expression (e.g. `x^3 - 3*x`, `sin(2*x) * exp(-0.1*x)`, `(x^2 - 4)/(x^2 + 1)`).
- **Automated Feature Detection**:
  - 🟢 **Roots / Zero-Crossings** ($f(x) = 0$)
  - 🟡 **Critical Points & Extrema** ($f'(x) = 0$, classified into Local Min / Local Max)
  - 🟣 **Inflection Points** ($f''(x) = 0$)
- **Layer Toggles**: View $f(x)$, first derivative $f'(x)$, and second derivative $f''(x)$ simultaneously.

---

## 🎮 Canvas Navigation & Controls

| Action | Control |
| :--- | :--- |
| **Pan Graph** | Click & drag anywhere on the canvas grid |
| **Zoom In / Out** | Mouse scroll wheel, pinch gesture, or `+` / `-` buttons on HUD |
| **Drag Control Points** | Click & drag highlighted colored points on curves or axes |
| **Reset View** | Click the reset icon on the HUD to restore standard $[-6, 6]$ viewport |
| **Center on (0,0)** | Center the origin in the middle of the viewport |
| **Export PNG** | Click the camera/download button in the header to save a high-res image |
| **Dark / Light Theme** | Click the sun/moon button in the top header |

---

## 🛠️ Project Structure

```
.
├── index.html              # Core application layout, modules & HUD
├── style.css               # Modern design system & responsive styling
├── app.js                  # Main controller, event wiring & KaTeX updates
├── calc-engine.js          # Numerical calculus algorithms & feature detection
├── calc-graph.js           # 2D Canvas graphing engine with drag & zoom
└── README.md               # Documentation & setup instructions
```

---

## 💻 Running Locally

No installation, Node.js, or package manager is required!

### Method 1: Direct Browser
Simply double-click `index.html` or open it with Google Chrome, Microsoft Edge, Firefox, or Safari.

### Method 2: Local HTTP Server (Optional)
Using Python:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 📜 License

MIT License. Feel free to use, modify, and distribute for educational or commercial purposes!
