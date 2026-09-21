/**
 * CalculusLab - Main Application Controller
 * Coordinates UI inputs, KaTeX mathematical typesetting, Canvas graphing engine,
 * and numerical calculus algorithms.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    activeModule: 'derivative', // 'derivative' | 'integral' | 'taylor' | 'limits' | 'sandbox'
    isDark: true,

    // Derivatives state
    derivative: {
      fnStr: 'x^3 - 3*x',
      x0: 1.0,
      h: 1.5,
      showSecant: true,
      showTangent: true,
      showDerivativeCurve: false,
      animating: false
    },

    // Integrals state
    integral: {
      fnStr: '0.2 * x^3 - x + 2',
      method: 'midpoint',
      n: 10,
      a: -2.0,
      b: 3.0,
      showPartitions: true,
      showExactArea: true,
      animating: false
    },

    // Taylor state
    taylor: {
      preset: 'sin(x)',
      customExpr: 'sin(x)',
      degree: 3,
      center: 0.0,
      showOriginal: true,
      showPoly: true,
      isPlaying: false,
      playTimer: null
    },

    // Limits state
    limits: {
      fnStr: 'sin(x) / x',
      c: 0.0,
      epsilon: 0.4,
      showEpsBand: true,
      showDeltaBand: true
    },

    // Sandbox state
    sandbox: {
      fnStr: '0.25*x^4 - 2*x^2 + x',
      showF: true,
      showD1: false,
      showD2: false,
      detectRoots: true,
      detectExtrema: true,
      detectInflection: true
    }
  };

  // DOM Elements
  const canvasEl = document.getElementById('calcCanvas');
  let graph = null;

  // Render KaTeX safely
  function renderKaTeX(containerId, latexString) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (typeof katex !== 'undefined') {
      try {
        katex.render(latexString, el, { throwOnError: false, displayMode: true });
      } catch (err) {
        el.textContent = latexString;
      }
    } else {
      el.textContent = latexString;
    }
  }

  // Update Bottom Dashboard Metrics
  function setMetrics(metricsArray) {
    const container = document.getElementById('mathMetrics');
    if (!container) return;
    container.innerHTML = metricsArray
      .map(
        (m) => `
      <div class="metric-pill">
        <span class="metric-label">${m.label}</span>
        <span class="metric-val">${m.val}</span>
      </div>
    `
      )
      .join('');
  }

  // --------------------------------------------------------------------------
  // 1. DERIVATIVE MODULE LOGIC
  // --------------------------------------------------------------------------
  function updateDerivativeModule() {
    const fn = CalcEngine.compileFunction(state.derivative.fnStr);
    const x0 = state.derivative.x0;
    const h = state.derivative.h;
    const y0 = fn(x0);

    const curves = [];
    const lines = [];
    const markers = [];
    const interactivePoints = [];

    // 1. Main Curve f(x)
    curves.push({
      fn: fn,
      color: '#38bdf8',
      width: 2.8,
      label: 'f(x)'
    });

    // 2. Derivative Curve f'(x) if toggled
    if (state.derivative.showDerivativeCurve) {
      curves.push({
        fn: (x) => CalcEngine.derivative(fn, x),
        color: '#f43f5e',
        width: 1.8,
        dashed: [5, 4],
        label: "f'(x)"
      });
    }

    // 3. Instantaneous Tangent Line
    const tangentSlope = CalcEngine.derivative(fn, x0);
    if (state.derivative.showTangent && !isNaN(tangentSlope) && isFinite(tangentSlope)) {
      const tangentFn = (x) => tangentSlope * (x - x0) + y0;
      curves.push({
        fn: tangentFn,
        color: '#fbbf24',
        width: 2.2,
        label: 'Tangent Line'
      });
    }

    // 4. Secant Line
    const secSlope = CalcEngine.secantSlope(fn, x0, h);
    const x1 = x0 + h;
    const y1 = fn(x1);

    if (state.derivative.showSecant && !isNaN(secSlope) && isFinite(secSlope)) {
      const secantFn = (x) => secSlope * (x - x0) + y0;
      curves.push({
        fn: secantFn,
        color: '#34d399',
        width: 1.8,
        dashed: [6, 4],
        label: 'Secant Line'
      });

      // Secant point Q(x0+h, f(x0+h))
      if (!isNaN(y1)) {
        markers.push({
          x: x1,
          y: y1,
          radius: 5,
          color: '#34d399',
          label: `Q (${x1.toFixed(2)}, ${y1.toFixed(2)})`
        });

        // Delta triangle lines
        lines.push({
          p1: { x: x0, y: y0 },
          p2: { x: x1, y: y0 },
          color: 'rgba(52, 211, 153, 0.4)',
          width: 1.5,
          dashed: [3, 3]
        });
        lines.push({
          p1: { x: x1, y: y0 },
          p2: { x: x1, y: y1 },
          color: 'rgba(52, 211, 153, 0.4)',
          width: 1.5,
          dashed: [3, 3]
        });
      }
    }

    // 5. Draggable Tangent Point P(x0, y0)
    if (!isNaN(y0)) {
      interactivePoints.push({
        id: 'x0_point',
        x: x0,
        y: y0,
        radius: 7,
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.35)',
        label: `P (${x0.toFixed(2)}, ${y0.toFixed(2)})`,
        onDrag: (newWorldX) => {
          state.derivative.x0 = Math.max(-5, Math.min(5, Number(newWorldX.toFixed(2))));
          document.getElementById('derivX0').value = state.derivative.x0;
          document.getElementById('valDerivX0').textContent = state.derivative.x0.toFixed(2);
          updateDerivativeModule();
        }
      });
    }

    // Update Graph Elements
    graph.setCurves(curves);
    graph.setShapes([]);
    graph.setShadedRegions([]);
    graph.setLines(lines);
    graph.setMarkers(markers);
    graph.setInteractivePoints(interactivePoints);
    graph.render();

    // Update Math Dashboard
    document.getElementById('mathTitle').textContent = 'Derivatives & Tangent Line';

    const hFmt = h.toFixed(2);
    const dy = (y1 - y0).toFixed(2);
    const mSecFmt = secSlope.toFixed(3);
    const mTgMFmt = tangentSlope.toFixed(3);
    const y0Fmt = y0.toFixed(2);
    const x0Fmt = x0.toFixed(2);

    const latex = `\\lim_{h \\to 0} \\frac{f(x_0 + h) - f(x_0)}{h} \\approx \\frac{${dy}}{${hFmt}} = ${mSecFmt} \\quad \\implies \\quad f'(${x0Fmt}) = ${mTgMFmt}`;
    renderKaTeX('mathEquation', latex);

    setMetrics([
      { label: 'Point x₀', val: x0Fmt },
      { label: 'f(x₀)', val: y0Fmt },
      { label: 'Secant Slope m', val: mSecFmt },
      { label: "Derivative f'(x₀)", val: mTgMFmt }
    ]);
  }

  // Animate h -> 0
  function animateH() {
    if (state.derivative.animating) return;
    state.derivative.animating = true;
    state.derivative.h = 2.5;

    function step() {
      if (state.derivative.h > 0.02 && state.derivative.animating) {
        state.derivative.h *= 0.94;
        if (state.derivative.h < 0.02) state.derivative.h = 0.01;

        document.getElementById('derivH').value = state.derivative.h;
        document.getElementById('valDerivH').textContent = state.derivative.h.toFixed(2);
        updateDerivativeModule();

        if (state.derivative.h > 0.01) {
          requestAnimationFrame(step);
        } else {
          state.derivative.animating = false;
        }
      } else {
        state.derivative.animating = false;
      }
    }
    requestAnimationFrame(step);
  }

  // --------------------------------------------------------------------------
  // 2. INTEGRAL & RIEMANN SUMS LOGIC
  // --------------------------------------------------------------------------
  function updateIntegralModule() {
    const fn = CalcEngine.compileFunction(state.integral.fnStr);
    const { a, b, n, method, showPartitions, showExactArea } = state.integral;

    const riemann = CalcEngine.computeRiemannSum(fn, a, b, n, method);

    const curves = [];
    const shapes = [];
    const shadedRegions = [];
    const interactivePoints = [];

    // 1. Main Curve f(x)
    curves.push({
      fn: fn,
      color: '#38bdf8',
      width: 2.8,
      label: 'f(x)'
    });

    // 2. Exact Area Shading
    if (showExactArea) {
      shadedRegions.push({
        f: fn,
        a: a,
        b: b,
        fill: 'rgba(56, 189, 248, 0.12)'
      });
    }

    // 3. Riemann Rectangles / Shapes
    if (showPartitions && riemann.partitions) {
      riemann.partitions.forEach((p) => {
        shapes.push(p);
      });
    }

    // 4. Draggable Bound Handles a and b on X-Axis
    interactivePoints.push({
      id: 'bound_a',
      x: a,
      y: 0,
      radius: 8,
      color: '#34d399',
      glowColor: 'rgba(52, 211, 153, 0.35)',
      label: `a = ${a.toFixed(1)}`,
      onDrag: (newWorldX) => {
        state.integral.a = Math.max(-5, Math.min(5, Number(newWorldX.toFixed(1))));
        document.getElementById('integralA').value = state.integral.a;
        document.getElementById('valIntegralA').textContent = state.integral.a.toFixed(1);
        updateIntegralModule();
      }
    });

    interactivePoints.push({
      id: 'bound_b',
      x: b,
      y: 0,
      radius: 8,
      color: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.35)',
      label: `b = ${b.toFixed(1)}`,
      onDrag: (newWorldX) => {
        state.integral.b = Math.max(-5, Math.min(5, Number(newWorldX.toFixed(1))));
        document.getElementById('integralB').value = state.integral.b;
        document.getElementById('valIntegralB').textContent = state.integral.b.toFixed(1);
        updateIntegralModule();
      }
    });

    // Update Graph Elements
    graph.setCurves(curves);
    graph.setShapes(shapes);
    graph.setShadedRegions(shadedRegions);
    graph.setLines([]);
    graph.setMarkers([]);
    graph.setInteractivePoints(interactivePoints);
    graph.render();

    // Update Math Dashboard
    document.getElementById('mathTitle').textContent = `Definite Integral & Riemann Sum (${method.toUpperCase()})`;

    const methodNames = {
      left: 'L_n',
      right: 'R_n',
      midpoint: 'M_n',
      trapezoid: 'T_n',
      simpson: 'S_n'
    };

    const latex = `\\int_{${a.toFixed(1)}}^{${b.toFixed(1)}} f(x)\\,dx \\approx ${methodNames[method]} = \\sum_{i=1}^{${n}} f(x_i^*)\\,\\Delta x = ${riemann.sum.toFixed(4)} \\quad \\left(\\text{Exact: } ${riemann.exact.toFixed(4)}\\right)`;
    renderKaTeX('mathEquation', latex);

    setMetrics([
      { label: `${methodNames[method]} Sum`, val: riemann.sum.toFixed(4) },
      { label: 'Exact Area', val: riemann.exact.toFixed(4) },
      { label: 'Abs Error', val: riemann.error.toFixed(4) },
      { label: '% Error', val: `${riemann.percentError.toFixed(2)}%` }
    ]);
  }

  // Animate n from 1 to 50
  function animateN() {
    if (state.integral.animating) return;
    state.integral.animating = true;
    let curN = 1;

    const interval = setInterval(() => {
      if (curN <= 50 && state.integral.animating) {
        state.integral.n = curN;
        document.getElementById('integralN').value = curN;
        document.getElementById('valIntegralN').textContent = curN;
        updateIntegralModule();
        curN++;
      } else {
        clearInterval(interval);
        state.integral.animating = false;
      }
    }, 60);
  }

  // --------------------------------------------------------------------------
  // 3. TAYLOR SERIES MODULE LOGIC
  // --------------------------------------------------------------------------
  function updateTaylorModule() {
    const { preset, customExpr, degree, center, showOriginal, showPoly } = state.taylor;
    const taylorData = CalcEngine.computeTaylorSeries(preset, customExpr, center, degree);

    const curves = [];
    const interactivePoints = [];

    // 1. Target function
    if (showOriginal) {
      curves.push({
        fn: taylorData.evalOriginal,
        color: '#38bdf8',
        width: 2.8,
        label: 'f(x)'
      });
    }

    // 2. Taylor Polynomial P_n(x)
    if (showPoly) {
      curves.push({
        fn: taylorData.evalPoly,
        color: '#fbbf24',
        width: 2.4,
        label: `P_${degree}(x)`
      });
    }

    // 3. Center point P(a, f(a))
    const yCenter = taylorData.evalOriginal(center);
    if (!isNaN(yCenter)) {
      interactivePoints.push({
        id: 'taylor_center',
        x: center,
        y: yCenter,
        radius: 7,
        color: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.35)',
        label: `Center a = ${center.toFixed(1)}`,
        onDrag: (newWorldX) => {
          state.taylor.center = Math.max(-3, Math.min(3, Number(newWorldX.toFixed(1))));
          document.getElementById('taylorCenter').value = state.taylor.center;
          document.getElementById('valTaylorCenter').textContent = state.taylor.center.toFixed(2);
          updateTaylorModule();
        }
      });
    }

    graph.setCurves(curves);
    graph.setShapes([]);
    graph.setShadedRegions([]);
    graph.setLines([]);
    graph.setMarkers([]);
    graph.setInteractivePoints(interactivePoints);
    graph.render();

    // Math Dashboard
    document.getElementById('mathTitle').textContent = `Taylor Polynomial Expansion around a = ${center.toFixed(1)}`;
    renderKaTeX('mathEquation', taylorData.latex);

    // Test error at sample point x = center + 1
    const testX = center + 1;
    const exactVal = taylorData.evalOriginal(testX);
    const approxVal = taylorData.evalPoly(testX);
    const errorAt1 = Math.abs(exactVal - approxVal);

    setMetrics([
      { label: 'Degree n', val: degree },
      { label: 'Center a', val: center.toFixed(2) },
      { label: 'P(a+1)', val: isNaN(approxVal) ? 'NaN' : approxVal.toFixed(4) },
      { label: 'Error at a+1', val: isNaN(errorAt1) ? 'NaN' : errorAt1.toFixed(4) }
    ]);
  }

  function toggleTaylorPlay() {
    if (state.taylor.isPlaying) {
      // Pause
      clearInterval(state.taylor.playTimer);
      state.taylor.isPlaying = false;
      document.getElementById('textPlay').textContent = 'Play Step';
    } else {
      // Play
      state.taylor.isPlaying = true;
      document.getElementById('textPlay').textContent = 'Pause';
      state.taylor.playTimer = setInterval(() => {
        let deg = state.taylor.degree + 1;
        if (deg > 14) deg = 0;
        state.taylor.degree = deg;
        document.getElementById('taylorDegree').value = deg;
        document.getElementById('valTaylorDegree').textContent = deg;
        updateTaylorModule();
      }, 700);
    }
  }

  // --------------------------------------------------------------------------
  // 4. LIMITS & EPSILON-DELTA MODULE LOGIC
  // --------------------------------------------------------------------------
  function updateLimitsModule() {
    const fn = CalcEngine.compileFunction(state.limits.fnStr);
    const { c, epsilon, showEpsBand, showDeltaBand } = state.limits;
    const analysis = CalcEngine.analyzeLimit(fn, c, epsilon);

    const curves = [];
    const shapes = [];
    const lines = [];
    const markers = [];
    const interactivePoints = [];

    // 1. Function Curve
    curves.push({
      fn: fn,
      color: '#38bdf8',
      width: 2.8,
      label: 'f(x)'
    });

    const L = analysis.overallLimit;

    // 2. Tolerance Bands
    if (!isNaN(L) && isFinite(L)) {
      // Horizontal Epsilon Band: y in [L - eps, L + eps]
      if (showEpsBand) {
        shapes.push({
          type: 'polygon',
          points: [
            { x: graph.viewport.xMin, y: L + epsilon },
            { x: graph.viewport.xMax, y: L + epsilon },
            { x: graph.viewport.xMax, y: L - epsilon },
            { x: graph.viewport.xMin, y: L - epsilon }
          ],
          fill: 'rgba(52, 211, 153, 0.14)',
          stroke: 'rgba(52, 211, 153, 0.4)',
          lineWidth: 1
        });
      }

      // Vertical Delta Band: x in [c - delta, c + delta]
      if (showDeltaBand && analysis.delta > 0) {
        shapes.push({
          type: 'polygon',
          points: [
            { x: c - analysis.delta, y: graph.viewport.yMax },
            { x: c + analysis.delta, y: graph.viewport.yMax },
            { x: c + analysis.delta, y: graph.viewport.yMin },
            { x: c - analysis.delta, y: graph.viewport.yMin }
          ],
          fill: 'rgba(56, 189, 248, 0.12)',
          stroke: 'rgba(56, 189, 248, 0.4)',
          lineWidth: 1
        });
      }

      // Limit Horizontal Line y = L
      lines.push({
        p1: { x: graph.viewport.xMin, y: L },
        p2: { x: graph.viewport.xMax, y: L },
        color: '#34d399',
        width: 1.5,
        dashed: [4, 4]
      });

      // Removable discontinuity open circle hole
      if (analysis.continuityType === 'removable') {
        markers.push({
          x: c,
          y: L,
          type: 'hole',
          color: '#f43f5e',
          label: `Hole (${c.toFixed(2)}, ${L.toFixed(2)})`
        });
      }
    }

    // Draggable point c on X-axis
    interactivePoints.push({
      id: 'limit_c',
      x: c,
      y: 0,
      radius: 8,
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.35)',
      label: `c = ${c.toFixed(2)}`,
      onDrag: (newWorldX) => {
        state.limits.c = Math.max(-4, Math.min(4, Number(newWorldX.toFixed(2))));
        document.getElementById('limitsC').value = state.limits.c;
        document.getElementById('valLimitsC').textContent = state.limits.c.toFixed(2);
        updateLimitsModule();
      }
    });

    graph.setCurves(curves);
    graph.setShapes(shapes);
    graph.setShadedRegions([]);
    graph.setLines(lines);
    graph.setMarkers(markers);
    graph.setInteractivePoints(interactivePoints);
    graph.render();

    // Math Dashboard
    document.getElementById('mathTitle').textContent = `Formal Limit & \\varepsilon-\\delta Definition`;

    const LStr = isNaN(L) ? '\\text{Does not exist}' : L.toFixed(3);
    const latex = `\\forall\\, \\varepsilon > 0, \\; \\exists\\, \\delta > 0 \\;\\text{s.t.}\\; 0 < |x - ${c.toFixed(2)}| < \\delta \\implies |f(x) - ${LStr}| < ${epsilon.toFixed(2)}`;
    renderKaTeX('mathEquation', latex);

    setMetrics([
      { label: 'Target c', val: c.toFixed(2) },
      { label: 'Left Limit L⁻', val: isNaN(analysis.leftLimit) ? 'None' : analysis.leftLimit.toFixed(3) },
      { label: 'Right Limit L⁺', val: isNaN(analysis.rightLimit) ? 'None' : analysis.rightLimit.toFixed(3) },
      { label: 'Calculated δ', val: analysis.delta.toFixed(3) }
    ]);
  }

  // --------------------------------------------------------------------------
  // 5. SANDBOX / FUNCTION EXPLORER MODULE LOGIC
  // --------------------------------------------------------------------------
  function updateSandboxModule() {
    const fn = CalcEngine.compileFunction(state.sandbox.fnStr);
    const { showF, showD1, showD2, detectRoots, detectExtrema, detectInflection } = state.sandbox;

    const curves = [];
    const markers = [];

    // 1. f(x)
    if (showF) {
      curves.push({
        fn: fn,
        color: '#38bdf8',
        width: 2.8,
        label: 'f(x)'
      });
    }

    // 2. f'(x)
    if (showD1) {
      curves.push({
        fn: (x) => CalcEngine.derivative(fn, x),
        color: '#f43f5e',
        width: 2,
        dashed: [5, 4],
        label: "f'(x)"
      });
    }

    // 3. f''(x)
    if (showD2) {
      curves.push({
        fn: (x) => CalcEngine.secondDerivative(fn, x),
        color: '#a855f7',
        width: 1.8,
        dashed: [3, 3],
        label: "f''(x)"
      });
    }

    // Analyze Features
    const features = CalcEngine.analyzeCurveFeatures(fn, graph.viewport.xMin, graph.viewport.xMax, 400);

    if (detectRoots) {
      features.roots.forEach((r) => {
        markers.push({
          x: r.x,
          y: r.y,
          radius: 5,
          color: '#34d399',
          label: r.label
        });
      });
    }

    if (detectExtrema) {
      features.criticalPoints.forEach((cp) => {
        markers.push({
          x: cp.x,
          y: cp.y,
          radius: 5,
          color: '#fbbf24',
          label: cp.label
        });
      });
    }

    if (detectInflection) {
      features.inflectionPoints.forEach((ip) => {
        markers.push({
          x: ip.x,
          y: ip.y,
          radius: 5,
          color: '#a855f7',
          label: ip.label
        });
      });
    }

    graph.setCurves(curves);
    graph.setShapes([]);
    graph.setShadedRegions([]);
    graph.setLines([]);
    graph.setMarkers(markers);
    graph.setInteractivePoints([]);
    graph.render();

    // Math Dashboard
    document.getElementById('mathTitle').textContent = `Function Analysis & Critical Points`;
    renderKaTeX('mathEquation', `f(x) = ${state.sandbox.fnStr}`);

    setMetrics([
      { label: 'Roots Found', val: features.roots.length },
      { label: 'Extrema Found', val: features.criticalPoints.length },
      { label: 'Inflections', val: features.inflectionPoints.length },
      { label: 'Domain', val: `[${graph.viewport.xMin.toFixed(1)}, ${graph.viewport.xMax.toFixed(1)}]` }
    ]);
  }

  // --------------------------------------------------------------------------
  // MASTER DISPATCHER
  // --------------------------------------------------------------------------
  function updateActiveModule() {
    switch (state.activeModule) {
      case 'derivative':
        updateDerivativeModule();
        break;
      case 'integral':
        updateIntegralModule();
        break;
      case 'taylor':
        updateTaylorModule();
        break;
      case 'limits':
        updateLimitsModule();
        break;
      case 'sandbox':
        updateSandboxModule();
        break;
    }
  }

  // --------------------------------------------------------------------------
  // EVENT LISTENERS INITIALIZATION
  // --------------------------------------------------------------------------
  function initListeners() {
    // 1. Module Tabs
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.control-panel').forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const mod = tab.dataset.module;
        state.activeModule = mod;

        const panel = document.getElementById(`panel-${mod}`);
        if (panel) panel.classList.add('active');

        // Reset view for new module
        graph.resetView(-6, 6, -4, 4);
        updateActiveModule();
      });
    });

    // 2. Derivative Controls
    const derivFnInput = document.getElementById('derivFunction');
    derivFnInput.addEventListener('input', (e) => {
      state.derivative.fnStr = e.target.value;
      updateDerivativeModule();
    });

    document.querySelectorAll('#panel-derivative .preset-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const fnStr = chip.dataset.fn;
        state.derivative.fnStr = fnStr;
        derivFnInput.value = fnStr;
        updateDerivativeModule();
      });
    });

    const derivX0 = document.getElementById('derivX0');
    derivX0.addEventListener('input', (e) => {
      state.derivative.x0 = parseFloat(e.target.value);
      document.getElementById('valDerivX0').textContent = state.derivative.x0.toFixed(2);
      updateDerivativeModule();
    });

    const derivH = document.getElementById('derivH');
    derivH.addEventListener('input', (e) => {
      state.derivative.h = parseFloat(e.target.value);
      document.getElementById('valDerivH').textContent = state.derivative.h.toFixed(2);
      updateDerivativeModule();
    });

    document.getElementById('btnAnimateH').addEventListener('click', animateH);

    document.getElementById('chkShowSecant').addEventListener('change', (e) => {
      state.derivative.showSecant = e.target.checked;
      updateDerivativeModule();
    });
    document.getElementById('chkShowTangent').addEventListener('change', (e) => {
      state.derivative.showTangent = e.target.checked;
      updateDerivativeModule();
    });
    document.getElementById('chkShowDerivativeCurve').addEventListener('change', (e) => {
      state.derivative.showDerivativeCurve = e.target.checked;
      updateDerivativeModule();
    });

    // 3. Integral Controls
    const integralFnInput = document.getElementById('integralFunction');
    integralFnInput.addEventListener('input', (e) => {
      state.integral.fnStr = e.target.value;
      updateIntegralModule();
    });

    document.querySelectorAll('#panel-integral .preset-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const fnStr = chip.dataset.fn;
        state.integral.fnStr = fnStr;
        integralFnInput.value = fnStr;
        updateIntegralModule();
      });
    });

    document.querySelectorAll('#riemannMethod .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#riemannMethod .segment-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.integral.method = btn.dataset.method;
        updateIntegralModule();
      });
    });

    const integralN = document.getElementById('integralN');
    integralN.addEventListener('input', (e) => {
      state.integral.n = parseInt(e.target.value, 10);
      document.getElementById('valIntegralN').textContent = state.integral.n;
      updateIntegralModule();
    });

    const integralA = document.getElementById('integralA');
    integralA.addEventListener('input', (e) => {
      state.integral.a = parseFloat(e.target.value);
      document.getElementById('valIntegralA').textContent = state.integral.a.toFixed(1);
      updateIntegralModule();
    });

    const integralB = document.getElementById('integralB');
    integralB.addEventListener('input', (e) => {
      state.integral.b = parseFloat(e.target.value);
      document.getElementById('valIntegralB').textContent = state.integral.b.toFixed(1);
      updateIntegralModule();
    });

    document.getElementById('btnAnimateN').addEventListener('click', animateN);
    document.getElementById('chkShowPartitions').addEventListener('change', (e) => {
      state.integral.showPartitions = e.target.checked;
      updateIntegralModule();
    });
    document.getElementById('chkShowExactArea').addEventListener('change', (e) => {
      state.integral.showExactArea = e.target.checked;
      updateIntegralModule();
    });

    // 4. Taylor Controls
    const taylorSelect = document.getElementById('taylorPresetSelect');
    taylorSelect.addEventListener('change', (e) => {
      state.taylor.preset = e.target.value;
      state.taylor.customExpr = e.target.value;
      updateTaylorModule();
    });

    const taylorDegree = document.getElementById('taylorDegree');
    taylorDegree.addEventListener('input', (e) => {
      state.taylor.degree = parseInt(e.target.value, 10);
      document.getElementById('valTaylorDegree').textContent = state.taylor.degree;
      updateTaylorModule();
    });

    const taylorCenter = document.getElementById('taylorCenter');
    taylorCenter.addEventListener('input', (e) => {
      state.taylor.center = parseFloat(e.target.value);
      document.getElementById('valTaylorCenter').textContent = state.taylor.center.toFixed(2);
      updateTaylorModule();
    });

    document.getElementById('btnTaylorPrev').addEventListener('click', () => {
      if (state.taylor.degree > 0) {
        state.taylor.degree--;
        taylorDegree.value = state.taylor.degree;
        document.getElementById('valTaylorDegree').textContent = state.taylor.degree;
        updateTaylorModule();
      }
    });

    document.getElementById('btnTaylorNext').addEventListener('click', () => {
      if (state.taylor.degree < 15) {
        state.taylor.degree++;
        taylorDegree.value = state.taylor.degree;
        document.getElementById('valTaylorDegree').textContent = state.taylor.degree;
        updateTaylorModule();
      }
    });

    document.getElementById('btnTaylorPlay').addEventListener('click', toggleTaylorPlay);

    document.getElementById('chkShowOriginalFunc').addEventListener('change', (e) => {
      state.taylor.showOriginal = e.target.checked;
      updateTaylorModule();
    });
    document.getElementById('chkShowTaylorPoly').addEventListener('change', (e) => {
      state.taylor.showPoly = e.target.checked;
      updateTaylorModule();
    });

    // 5. Limits Controls
    const limitsFnInput = document.getElementById('limitsFunction');
    limitsFnInput.addEventListener('input', (e) => {
      state.limits.fnStr = e.target.value;
      updateLimitsModule();
    });

    document.querySelectorAll('#panel-limits .preset-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.limits.fnStr = chip.dataset.fn;
        limitsFnInput.value = chip.dataset.fn;
        if (chip.dataset.c !== undefined) {
          state.limits.c = parseFloat(chip.dataset.c);
          document.getElementById('limitsC').value = state.limits.c;
          document.getElementById('valLimitsC').textContent = state.limits.c.toFixed(2);
        }
        updateLimitsModule();
      });
    });

    const limitsC = document.getElementById('limitsC');
    limitsC.addEventListener('input', (e) => {
      state.limits.c = parseFloat(e.target.value);
      document.getElementById('valLimitsC').textContent = state.limits.c.toFixed(2);
      updateLimitsModule();
    });

    const limitsEps = document.getElementById('limitsEps');
    limitsEps.addEventListener('input', (e) => {
      state.limits.epsilon = parseFloat(e.target.value);
      document.getElementById('valLimitsEps').textContent = state.limits.epsilon.toFixed(2);
      updateLimitsModule();
    });

    document.getElementById('chkShowEpsBand').addEventListener('change', (e) => {
      state.limits.showEpsBand = e.target.checked;
      updateLimitsModule();
    });
    document.getElementById('chkShowDeltaBand').addEventListener('change', (e) => {
      state.limits.showDeltaBand = e.target.checked;
      updateLimitsModule();
    });

    // 6. Sandbox Controls
    const sandboxFnInput = document.getElementById('sandboxFunction');
    sandboxFnInput.addEventListener('input', (e) => {
      state.sandbox.fnStr = e.target.value;
      updateSandboxModule();
    });

    document.querySelectorAll('#panel-sandbox .preset-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.sandbox.fnStr = chip.dataset.fn;
        sandboxFnInput.value = chip.dataset.fn;
        updateSandboxModule();
      });
    });

    document.getElementById('chkSandboxF').addEventListener('change', (e) => {
      state.sandbox.showF = e.target.checked;
      updateSandboxModule();
    });
    document.getElementById('chkSandboxD1').addEventListener('change', (e) => {
      state.sandbox.showD1 = e.target.checked;
      updateSandboxModule();
    });
    document.getElementById('chkSandboxD2').addEventListener('change', (e) => {
      state.sandbox.showD2 = e.target.checked;
      updateSandboxModule();
    });
    document.getElementById('chkDetectRoots').addEventListener('change', (e) => {
      state.sandbox.detectRoots = e.target.checked;
      updateSandboxModule();
    });
    document.getElementById('chkDetectExtrema').addEventListener('change', (e) => {
      state.sandbox.detectExtrema = e.target.checked;
      updateSandboxModule();
    });
    document.getElementById('chkDetectInflection').addEventListener('change', (e) => {
      state.sandbox.detectInflection = e.target.checked;
      updateSandboxModule();
    });

    // 7. HUD Canvas Navigation
    document.getElementById('btnZoomIn').addEventListener('click', () => {
      graph.zoom(0.8);
      updateActiveModule();
    });
    document.getElementById('btnZoomOut').addEventListener('click', () => {
      graph.zoom(1.25);
      updateActiveModule();
    });
    document.getElementById('btnResetView').addEventListener('click', () => {
      graph.resetView(-6, 6, -4, 4);
      updateActiveModule();
    });
    document.getElementById('btnCenterOrigin').addEventListener('click', () => {
      const spanX = graph.viewport.xMax - graph.viewport.xMin;
      const spanY = graph.viewport.yMax - graph.viewport.yMin;
      graph.viewport.xMin = -spanX / 2;
      graph.viewport.xMax = spanX / 2;
      graph.viewport.yMin = -spanY / 2;
      graph.viewport.yMax = spanY / 2;
      graph.render();
      updateActiveModule();
    });
    const btnToggleGrid = document.getElementById('btnToggleGrid');
    btnToggleGrid.addEventListener('click', () => {
      graph.showGrid = !graph.showGrid;
      btnToggleGrid.classList.toggle('active', graph.showGrid);
      graph.render();
    });

    // 8. Header Utilities
    document.getElementById('btnExport').addEventListener('click', () => {
      graph.exportPNG(`calculus-${state.activeModule}.png`);
    });

    const btnTheme = document.getElementById('btnTheme');
    btnTheme.addEventListener('click', () => {
      state.isDark = !state.isDark;
      document.body.classList.toggle('theme-light', !state.isDark);
      document.body.classList.toggle('theme-dark', state.isDark);
      graph.setTheme(state.isDark);
      updateActiveModule();
    });

    // Help Modal
    const helpModal = document.getElementById('helpModal');
    document.getElementById('btnHelp').addEventListener('click', () => {
      helpModal.classList.remove('hidden');
    });
    document.getElementById('btnCloseHelp').addEventListener('click', () => {
      helpModal.classList.add('hidden');
    });
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.add('hidden');
    });
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  function init() {
    graph = new CalcGraph(canvasEl, {
      xMin: -6,
      xMax: 6,
      yMin: -4,
      yMax: 4
    });

    initListeners();
    updateActiveModule();
  }

  // Wait for DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render when external fonts and CDN scripts (KaTeX, Math.js) fully settle
  window.addEventListener('load', () => {
    if (graph) {
      graph.resize();
      updateActiveModule();
    }
  });
})();
