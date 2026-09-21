/**
 * CalculusLab - Core Calculus Mathematics & Numerical Engine
 * Handles expression parsing, numerical differentiation, integration,
 * Taylor polynomial expansion, limit analysis, and curve feature detection.
 */

(function (global) {
  'use strict';

  const CalcEngine = {};

  /**
   * Safely compiles a mathematical expression into a JavaScript function f(x).
   * Supports math.js if loaded, with robust native math fallback.
   */
  CalcEngine.compileFunction = function (exprStr) {
    if (!exprStr || typeof exprStr !== 'string') {
      return (x) => 0;
    }

    // Clean up input
    const sanitized = exprStr.trim();

    if (typeof math !== 'undefined' && math.compile) {
      try {
        const compiled = math.compile(sanitized);
        return function (x) {
          try {
            const scope = { x: x, e: Math.E, pi: Math.PI, PI: Math.PI };
            const res = compiled.evaluate(scope);
            if (typeof res === 'object' && res.im !== undefined) {
              return isNaN(res.re) ? NaN : res.re; // real part if complex
            }
            return typeof res === 'number' && isFinite(res) ? res : NaN;
          } catch (e) {
            return NaN;
          }
        };
      } catch (err) {
        console.warn('mathjs compile error:', err);
      }
    }

    // Fallback: simple evaluator for standard math expressions
    try {
      const jsExpr = sanitized
        .replace(/\^/g, '**')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\blog\b/g, 'Math.log10')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

      const fn = new Function('x', `"use strict"; try { const y = ${jsExpr}; return (typeof y === 'number' && isFinite(y)) ? y : NaN; } catch(e) { return NaN; }`);
      // Test evaluate at x = 1
      fn(1);
      return fn;
    } catch (e) {
      return (x) => NaN;
    }
  };

  /**
   * Numerical First Derivative: f'(x)
   * Central difference with step h = 1e-5
   */
  CalcEngine.derivative = function (f, x, h = 1e-5) {
    const fPlus = f(x + h);
    const fMinus = f(x - h);
    if (isNaN(fPlus) || isNaN(fMinus)) return NaN;
    return (fPlus - fMinus) / (2 * h);
  };

  /**
   * Numerical Second Derivative: f''(x)
   * Central difference with step h = 1e-4
   */
  CalcEngine.secondDerivative = function (f, x, h = 1e-4) {
    const fPlus = f(x + h);
    const f0 = f(x);
    const fMinus = f(x - h);
    if (isNaN(fPlus) || isNaN(f0) || isNaN(fMinus)) return NaN;
    return (fPlus - 2 * f0 + fMinus) / (h * h);
  };

  /**
   * Secant Slope: (f(x0 + h) - f(x0)) / h
   */
  CalcEngine.secantSlope = function (f, x0, h) {
    if (Math.abs(h) < 1e-9) {
      return CalcEngine.derivative(f, x0);
    }
    const y0 = f(x0);
    const yh = f(x0 + h);
    if (isNaN(y0) || isNaN(yh)) return NaN;
    return (yh - y0) / h;
  };

  /**
   * High-accuracy Definite Integral: Composite Simpson's 3/8 or 1/3 Rule
   * Used as reference standard for comparing Riemann sums
   */
  CalcEngine.definiteIntegral = function (f, a, b, n = 1000) {
    if (a === b) return 0;
    if (a > b) return -CalcEngine.definiteIntegral(f, b, a, n);
    if (n % 2 !== 0) n++; // Must be even for Simpson's 1/3

    const h = (b - a) / n;
    let sum = f(a) + f(b);

    if (isNaN(sum)) sum = 0;

    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      const y = f(x);
      if (!isNaN(y) && isFinite(y)) {
        sum += (i % 2 === 0 ? 2 : 4) * y;
      }
    }

    return (h / 3) * sum;
  };

  /**
   * Riemann Sum & Numerical Integration approximation with partition geometry
   * Returns: {
   *   method: string,
   *   sum: number,
   *   exact: number,
   *   error: number,
   *   percentError: number,
   *   dx: number,
   *   partitions: Array<{ xLeft, xRight, sampleX, height, y0, y1, isPositive }>
   * }
   */
  CalcEngine.computeRiemannSum = function (f, a, b, n, method = 'midpoint') {
    const isReversed = a > b;
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    const numIntervals = Math.max(1, Math.min(500, Math.round(n)));
    const dx = (end - start) / numIntervals;

    let sum = 0;
    const partitions = [];

    for (let i = 0; i < numIntervals; i++) {
      const xL = start + i * dx;
      const xR = xL + dx;
      let sampleX = xL;
      let height = 0;
      let yL = f(xL);
      let yR = f(xR);

      if (isNaN(yL)) yL = 0;
      if (isNaN(yR)) yR = 0;

      switch (method) {
        case 'left':
          sampleX = xL;
          height = yL;
          sum += height * dx;
          partitions.push({
            type: 'rect',
            xLeft: xL,
            xRight: xR,
            sampleX: sampleX,
            height: height,
            y0: 0,
            y1: height,
            isPositive: height >= 0
          });
          break;

        case 'right':
          sampleX = xR;
          height = yR;
          sum += height * dx;
          partitions.push({
            type: 'rect',
            xLeft: xL,
            xRight: xR,
            sampleX: sampleX,
            height: height,
            y0: 0,
            y1: height,
            isPositive: height >= 0
          });
          break;

        case 'midpoint':
          sampleX = xL + dx / 2;
          height = f(sampleX);
          if (isNaN(height)) height = 0;
          sum += height * dx;
          partitions.push({
            type: 'rect',
            xLeft: xL,
            xRight: xR,
            sampleX: sampleX,
            height: height,
            y0: 0,
            y1: height,
            isPositive: height >= 0
          });
          break;

        case 'trapezoid':
          height = (yL + yR) / 2;
          sum += height * dx;
          partitions.push({
            type: 'trapezoid',
            xLeft: xL,
            xRight: xR,
            yLeft: yL,
            yRight: yR,
            height: height,
            isPositive: height >= 0
          });
          break;

        case 'simpson':
          const xMid = xL + dx / 2;
          const yMid = isNaN(f(xMid)) ? 0 : f(xMid);
          // Simpson piece area = (dx / 6) * (yL + 4*yMid + yR)
          const pieceArea = (dx / 6) * (yL + 4 * yMid + yR);
          sum += pieceArea;
          partitions.push({
            type: 'simpson',
            xLeft: xL,
            xRight: xR,
            xMid: xMid,
            yLeft: yL,
            yMid: yMid,
            yRight: yR,
            height: pieceArea / dx,
            isPositive: pieceArea >= 0
          });
          break;

        default:
          sampleX = xL + dx / 2;
          height = f(sampleX);
          sum += height * dx;
          partitions.push({
            type: 'rect',
            xLeft: xL,
            xRight: xR,
            sampleX: sampleX,
            height: height,
            y0: 0,
            y1: height,
            isPositive: height >= 0
          });
      }
    }

    if (isReversed) {
      sum = -sum;
    }

    const exact = CalcEngine.definiteIntegral(f, a, b);
    const error = Math.abs(sum - exact);
    const percentError = Math.abs(exact) > 1e-7 ? (error / Math.abs(exact)) * 100 : 0;

    return {
      method: method,
      sum: sum,
      exact: exact,
      error: error,
      percentError: percentError,
      dx: dx,
      partitions: partitions
    };
  };

  /**
   * Factorial utility
   */
  CalcEngine.factorial = function (n) {
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  /**
   * Compute Taylor Polynomial Coefficients & Evaluation Function
   * For common standard functions or symbolic Math.js derivatives
   */
  CalcEngine.computeTaylorSeries = function (presetKey, customExpr, centerA, degreeN) {
    const a = centerA;
    const n = Math.max(0, Math.min(15, Math.round(degreeN)));

    // Standard analytical derivatives for classic functions
    const presets = {
      'sin(x)': {
        latexFunc: '\\sin(x)',
        evalFunc: (x) => Math.sin(x),
        getCoeff: (k, aVal) => {
          // d^k/dx^k sin(x) = sin(x + k*pi/2)
          return Math.sin(aVal + (k * Math.PI) / 2) / CalcEngine.factorial(k);
        }
      },
      'cos(x)': {
        latexFunc: '\\cos(x)',
        evalFunc: (x) => Math.cos(x),
        getCoeff: (k, aVal) => {
          return Math.cos(aVal + (k * Math.PI) / 2) / CalcEngine.factorial(k);
        }
      },
      'exp(x)': {
        latexFunc: 'e^x',
        evalFunc: (x) => Math.exp(x),
        getCoeff: (k, aVal) => {
          return Math.exp(aVal) / CalcEngine.factorial(k);
        }
      },
      'ln(1+x)': {
        latexFunc: '\\ln(1+x)',
        evalFunc: (x) => (x > -1 ? Math.log(1 + x) : NaN),
        getCoeff: (k, aVal) => {
          if (aVal <= -1) return NaN;
          if (k === 0) return Math.log(1 + aVal);
          // (k-1)! * (-1)^(k+1) / (1 + a)^k
          const sign = k % 2 === 1 ? 1 : -1;
          return (sign * (1 / k)) / Math.pow(1 + aVal, k);
        }
      },
      '1/(1-x)': {
        latexFunc: '\\frac{1}{1-x}',
        evalFunc: (x) => (x !== 1 ? 1 / (1 - x) : NaN),
        getCoeff: (k, aVal) => {
          if (aVal === 1) return NaN;
          // k! / (1-a)^(k+1) / k! = 1 / (1-a)^(k+1)
          return 1 / Math.pow(1 - aVal, k + 1);
        }
      },
      'arctan(x)': {
        latexFunc: '\\arctan(x)',
        evalFunc: (x) => Math.atan(x),
        getCoeff: null // Will use symbolic or numerical fallback
      }
    };

    let targetPreset = presets[presetKey];
    let originalFunc = targetPreset ? targetPreset.evalFunc : CalcEngine.compileFunction(customExpr);
    let coeffs = [];

    if (targetPreset && targetPreset.getCoeff) {
      for (let k = 0; k <= n; k++) {
        const c = targetPreset.getCoeff(k, a);
        coeffs.push(isNaN(c) ? 0 : c);
      }
    } else {
      // Use mathjs symbolic derivative if available
      let computedWithMathjs = false;
      if (typeof math !== 'undefined' && math.derivative) {
        try {
          let curExpr = customExpr || presetKey;
          let parsed = math.parse(curExpr);
          // k = 0
          let c0 = parsed.evaluate({ x: a });
          coeffs.push(isNaN(c0) ? 0 : c0);

          let curDeriv = parsed;
          for (let k = 1; k <= n; k++) {
            curDeriv = math.derivative(curDeriv, 'x');
            let val = curDeriv.evaluate({ x: a });
            let coeff = val / CalcEngine.factorial(k);
            coeffs.push(isNaN(coeff) ? 0 : coeff);
          }
          computedWithMathjs = true;
        } catch (e) {
          computedWithMathjs = false;
        }
      }

      if (!computedWithMathjs) {
        // High-precision finite differences fallback
        coeffs.push(originalFunc(a));
        let h = 1e-4;
        for (let k = 1; k <= n; k++) {
          // Approximate k-th derivative at a
          let derivK = 0;
          for (let i = 0; i <= k; i++) {
            const comb = CalcEngine.factorial(k) / (CalcEngine.factorial(i) * CalcEngine.factorial(k - i));
            const sign = (k - i) % 2 === 0 ? 1 : -1;
            derivK += sign * comb * originalFunc(a + i * h);
          }
          derivK /= Math.pow(h, k);
          coeffs.push(derivK / CalcEngine.factorial(k));
        }
      }
    }

    // Create Taylor Polynomial evaluator P_n(x)
    const taylorFunc = function (x) {
      const delta = x - a;
      let val = 0;
      let power = 1;
      for (let k = 0; k <= n; k++) {
        val += coeffs[k] * power;
        power *= delta;
      }
      return val;
    };

    // Build LaTeX polynomial representation
    let latexParts = [];
    for (let k = 0; k <= n; k++) {
      const c = coeffs[k];
      if (Math.abs(c) < 1e-7) continue;

      let term = '';
      const rounded = Math.abs(c - Math.round(c)) < 1e-4 ? Math.round(c) : Number(c.toFixed(4));
      const absVal = Math.abs(rounded);
      const sign = c >= 0 ? (latexParts.length > 0 ? '+ ' : '') : '- ';

      let factor = '';
      if (k === 0) {
        factor = `${absVal}`;
      } else {
        const coeffStr = absVal === 1 ? '' : `${absVal}`;
        const centerStr = a === 0 ? 'x' : (a > 0 ? `(x - ${a})` : `(x + ${Math.abs(a)})`);
        const expStr = k === 1 ? centerStr : `${centerStr}^{${k}}`;
        factor = `${coeffStr}${expStr}`;
      }

      latexParts.push(`${sign}${factor}`);
    }

    const latexString = latexParts.length > 0 ? latexParts.join(' ') : '0';

    return {
      degree: n,
      center: a,
      coeffs: coeffs,
      evalPoly: taylorFunc,
      evalOriginal: originalFunc,
      latex: `P_{${n}}(x) = ${latexString}`
    };
  };

  /**
   * Analyze Limits and Continuity around point c
   */
  CalcEngine.analyzeLimit = function (f, c, epsilon = 0.5) {
    const epsSteps = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5];

    let leftVals = [];
    let rightVals = [];

    for (let h of epsSteps) {
      leftVals.push(f(c - h));
      rightVals.push(f(c + h));
    }

    const leftLimit = leftVals[leftVals.length - 1];
    const rightLimit = rightVals[rightVals.length - 1];
    const valueAtC = f(c);

    const isLeftFinite = !isNaN(leftLimit) && isFinite(leftLimit);
    const isRightFinite = !isNaN(rightLimit) && isFinite(rightLimit);
    const isValueFinite = !isNaN(valueAtC) && isFinite(valueAtC);

    const diff = Math.abs(leftLimit - rightLimit);
    const limitExists = isLeftFinite && isRightFinite && diff < 1e-3;
    const overallLimit = limitExists ? (leftLimit + rightLimit) / 2 : NaN;

    let continuityType = 'continuous';
    if (!limitExists) {
      if ((!isLeftFinite || !isRightFinite) && (Math.abs(leftLimit) > 1e4 || Math.abs(rightLimit) > 1e4)) {
        continuityType = 'infinite';
      } else {
        continuityType = 'jump';
      }
    } else if (!isValueFinite || Math.abs(valueAtC - overallLimit) > 1e-3) {
      continuityType = 'removable';
    }

    // Solve for delta given epsilon around c if limit exists
    let delta = 0.2;
    if (limitExists && !isNaN(overallLimit)) {
      // Find delta such that |f(x) - L| <= epsilon for |x - c| <= delta
      let step = 0.005;
      let testDelta = step;
      let maxDelta = 5.0;
      let valid = true;

      while (testDelta <= maxDelta && valid) {
        const yMinus = f(c - testDelta);
        const yPlus = f(c + testDelta);
        if (Math.abs(yMinus - overallLimit) > epsilon || Math.abs(yPlus - overallLimit) > epsilon) {
          valid = false;
          break;
        }
        testDelta += step;
      }
      delta = Math.max(0.01, testDelta - step);
    }

    return {
      c: c,
      valueAtC: valueAtC,
      leftLimit: leftLimit,
      rightLimit: rightLimit,
      overallLimit: overallLimit,
      limitExists: limitExists,
      continuityType: continuityType,
      epsilon: epsilon,
      delta: delta
    };
  };

  /**
   * Detect Curve Features: Roots, Critical Points, Inflection Points
   */
  CalcEngine.analyzeCurveFeatures = function (f, xMin = -10, xMax = 10, samples = 400) {
    const roots = [];
    const criticalPoints = [];
    const inflectionPoints = [];

    const step = (xMax - xMin) / samples;
    let prevX = xMin;
    let prevY = f(prevX);
    let prevD1 = CalcEngine.derivative(f, prevX);
    let prevD2 = CalcEngine.secondDerivative(f, prevX);

    for (let i = 1; i <= samples; i++) {
      const curX = xMin + i * step;
      const curY = f(curX);
      const curD1 = CalcEngine.derivative(f, curX);
      const curD2 = CalcEngine.secondDerivative(f, curX);

      // Check root (f(x) crosses 0)
      if (!isNaN(prevY) && !isNaN(curY) && isFinite(prevY) && isFinite(curY)) {
        if (prevY * curY <= 0 && Math.abs(curY - prevY) < 50) {
          // Refine root via secant/bisection
          const rootX = prevX - prevY * ((curX - prevX) / (curY - prevY));
          if (roots.length === 0 || Math.abs(roots[roots.length - 1].x - rootX) > 0.05) {
            roots.push({ x: rootX, y: 0, label: `Root (${rootX.toFixed(2)}, 0)` });
          }
        }
      }

      // Check critical point (f'(x) crosses 0)
      if (!isNaN(prevD1) && !isNaN(curD1) && isFinite(prevD1) && isFinite(curD1)) {
        if (prevD1 * curD1 <= 0 && Math.abs(curD1 - prevD1) < 50) {
          const critX = (prevX + curX) / 2;
          const critY = f(critX);
          const d2Val = CalcEngine.secondDerivative(f, critX);
          let type = 'critical';
          if (d2Val > 0.01) type = 'local_min';
          else if (d2Val < -0.01) type = 'local_max';
          else type = 'saddle';

          if (criticalPoints.length === 0 || Math.abs(criticalPoints[criticalPoints.length - 1].x - critX) > 0.08) {
            criticalPoints.push({
              x: critX,
              y: critY,
              type: type,
              label: `${type === 'local_min' ? 'Min' : type === 'local_max' ? 'Max' : 'Crit'} (${critX.toFixed(2)}, ${critY.toFixed(2)})`
            });
          }
        }
      }

      // Check inflection point (f''(x) crosses 0)
      if (!isNaN(prevD2) && !isNaN(curD2) && isFinite(prevD2) && isFinite(curD2)) {
        if (prevD2 * curD2 <= 0 && Math.abs(curD2 - prevD2) < 100) {
          const inflX = (prevX + curX) / 2;
          const inflY = f(inflX);
          if (inflectionPoints.length === 0 || Math.abs(inflectionPoints[inflectionPoints.length - 1].x - inflX) > 0.1) {
            inflectionPoints.push({
              x: inflX,
              y: inflY,
              label: `Inflection (${inflX.toFixed(2)}, ${inflY.toFixed(2)})`
            });
          }
        }
      }

      prevX = curX;
      prevY = curY;
      prevD1 = curD1;
      prevD2 = curD2;
    }

    return {
      roots: roots,
      criticalPoints: criticalPoints,
      inflectionPoints: inflectionPoints
    };
  };

  global.CalcEngine = CalcEngine;
})(typeof window !== 'undefined' ? window : this);
