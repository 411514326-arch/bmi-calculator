/**
 * CalculusLab - Interactive 2D Canvas Graphing Engine
 * Supports pan, zoom, retina display, curve plotting with asymptote clipping,
 * shaded Riemann sums, tangent/secant lines, and draggable on-canvas math points.
 */

(function (global) {
  'use strict';

  class CalcGraph {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');

      // Coordinate viewport (World coordinates)
      this.viewport = {
        xMin: options.xMin || -6,
        xMax: options.xMax || 6,
        yMin: options.yMin || -4,
        yMax: options.yMax || 4
      };

      // Theme colors
      this.theme = {
        bg: '#0f172a',
        gridMajor: '#1e293b',
        gridMinor: '#141e33',
        axis: '#64748b',
        text: '#94a3b8',
        crosshair: 'rgba(148, 163, 184, 0.4)',
        primaryCurve: '#38bdf8', // Vibrant Cyan
        secondaryCurve: '#f43f5e', // Vibrant Rose
        tertiaryCurve: '#a855f7', // Purple
        tangentLine: '#fbbf24', // Amber
        secantLine: '#34d399', // Emerald
        areaPositive: 'rgba(56, 189, 248, 0.28)',
        areaNegative: 'rgba(244, 63, 94, 0.28)',
        borderPositive: '#38bdf8',
        borderNegative: '#f43f5e',
        pointFill: '#ffffff',
        pointStroke: '#38bdf8'
      };

      // Interaction State
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.draggedPoint = null;
      this.interactivePoints = []; // Registered draggable points: [{ id, x, y, radius, color, onDrag }]
      this.mousePos = null; // { worldX, worldY, screenX, screenY }
      this.showCrosshairs = true;
      this.showGrid = true;

      // Layers to render
      this.curves = []; // [{ fn, color, width, dashed, label }]
      this.shapes = []; // [{ type: 'rect'|'trapezoid'|'polygon', points, fill, stroke }]
      this.lines = []; // [{ p1, p2, color, width, dashed }]
      this.markers = []; // [{ x, y, label, color, type }]
      this.shadedRegions = []; // [{ f, a, b, fillPos, fillNeg }]

      // High-DPI Scaling & Event Binding
      this.pixelRatio = window.devicePixelRatio || 1;
      this.initEvents();
      this.resize();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.round(this.width * this.pixelRatio);
      this.canvas.height = Math.round(this.height * this.pixelRatio);

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.pixelRatio, this.pixelRatio);

      this.render();
    }

    // Coordinate conversions
    toScreenX(worldX) {
      return ((worldX - this.viewport.xMin) / (this.viewport.xMax - this.viewport.xMin)) * this.width;
    }

    toScreenY(worldY) {
      return this.height - ((worldY - this.viewport.yMin) / (this.viewport.yMax - this.viewport.yMin)) * this.height;
    }

    toWorldX(screenX) {
      return this.viewport.xMin + (screenX / this.width) * (this.viewport.xMax - this.viewport.xMin);
    }

    toWorldY(screenY) {
      return this.viewport.yMin + ((this.height - screenY) / this.height) * (this.viewport.yMax - this.viewport.yMin);
    }

    // View manipulation
    pan(deltaWorldX, deltaWorldY) {
      this.viewport.xMin += deltaWorldX;
      this.viewport.xMax += deltaWorldX;
      this.viewport.yMin += deltaWorldY;
      this.viewport.yMax += deltaWorldY;
      this.render();
    }

    zoom(factor, centerScreenX = this.width / 2, centerScreenY = this.height / 2) {
      const centerWorldX = this.toWorldX(centerScreenX);
      const centerWorldY = this.toWorldY(centerScreenY);

      const spanX = (this.viewport.xMax - this.viewport.xMin) * factor;
      const spanY = (this.viewport.yMax - this.viewport.yMin) * factor;

      // Restrict zoom limits
      if (spanX < 0.1 || spanX > 1000) return;

      const ratioX = centerScreenX / this.width;
      const ratioY = 1 - centerScreenY / this.height;

      this.viewport.xMin = centerWorldX - ratioX * spanX;
      this.viewport.xMax = this.viewport.xMin + spanX;
      this.viewport.yMin = centerWorldY - ratioY * spanY;
      this.viewport.yMax = this.viewport.yMin + spanY;

      this.render();
    }

    resetView(xMin = -6, xMax = 6, yMin = -4, yMax = 4) {
      this.viewport = { xMin, xMax, yMin, yMax };
      this.render();
    }

    setTheme(isDark) {
      if (isDark) {
        this.theme.bg = '#0f172a';
        this.theme.gridMajor = '#1e293b';
        this.theme.gridMinor = '#141e33';
        this.theme.axis = '#64748b';
        this.theme.text = '#94a3b8';
        this.theme.crosshair = 'rgba(148, 163, 184, 0.4)';
      } else {
        this.theme.bg = '#ffffff';
        this.theme.gridMajor = '#e2e8f0';
        this.theme.gridMinor = '#f1f5f9';
        this.theme.axis = '#475569';
        this.theme.text = '#64748b';
        this.theme.crosshair = 'rgba(100, 116, 139, 0.35)';
      }
      this.render();
    }

    // Interactive Drag / Mouse Event Bindings
    initEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        return {
          screenX,
          screenY,
          worldX: this.toWorldX(screenX),
          worldY: this.toWorldY(screenY)
        };
      };

      const onStart = (e) => {
        const pos = getPos(e);
        this.dragStart = { x: pos.screenX, y: pos.screenY };

        // Check if clicked close to an interactive point
        this.draggedPoint = null;
        for (const pt of this.interactivePoints) {
          const ptScreenX = this.toScreenX(pt.x);
          const ptScreenY = this.toScreenY(pt.y !== undefined ? pt.y : 0);
          const dist = Math.hypot(pos.screenX - ptScreenX, pos.screenY - ptScreenY);
          const hitRadius = (pt.radius || 10) + 12;
          if (dist <= hitRadius) {
            this.draggedPoint = pt;
            break;
          }
        }

        this.isDragging = true;
      };

      const onMove = (e) => {
        const pos = getPos(e);
        this.mousePos = pos;

        if (this.isDragging) {
          if (this.draggedPoint) {
            // Dragging interactive point
            if (this.draggedPoint.onDrag) {
              this.draggedPoint.onDrag(pos.worldX, pos.worldY);
            }
          } else {
            // Panning graph
            const dxScreen = pos.screenX - this.dragStart.x;
            const dyScreen = pos.screenY - this.dragStart.y;
            const dxWorld = -(dxScreen / this.width) * (this.viewport.xMax - this.viewport.xMin);
            const dyWorld = (dyScreen / this.height) * (this.viewport.yMax - this.viewport.yMin);

            this.viewport.xMin += dxWorld;
            this.viewport.xMax += dxWorld;
            this.viewport.yMin += dyWorld;
            this.viewport.yMax += dyWorld;

            this.dragStart = { x: pos.screenX, y: pos.screenY };
            this.render();
          }
        } else {
          // Hover cursor change
          let hoveringPoint = false;
          for (const pt of this.interactivePoints) {
            const ptScreenX = this.toScreenX(pt.x);
            const ptScreenY = this.toScreenY(pt.y !== undefined ? pt.y : 0);
            const dist = Math.hypot(pos.screenX - ptScreenX, pos.screenY - ptScreenY);
            if (dist <= (pt.radius || 10) + 8) {
              hoveringPoint = true;
              break;
            }
          }
          this.canvas.style.cursor = hoveringPoint ? 'grab' : 'crosshair';
          this.render();
        }
      };

      const onEnd = () => {
        this.isDragging = false;
        this.draggedPoint = null;
        this.canvas.style.cursor = 'crosshair';
        this.render();
      };

      // Mouse
      this.canvas.addEventListener('mousedown', onStart);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);

      // Touch
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onStart(e);
      }, { passive: false });
      window.addEventListener('touchmove', (e) => {
        if (this.isDragging) e.preventDefault();
        onMove(e);
      }, { passive: false });
      window.addEventListener('touchend', onEnd);

      // Wheel Zoom
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 0.88 : 1.14;
        this.zoom(zoomFactor, screenX, screenY);
      }, { passive: false });

      // Leave
      this.canvas.addEventListener('mouseleave', () => {
        this.mousePos = null;
        this.render();
      });

      // Window resize
      window.addEventListener('resize', () => this.resize());
    }

    // Grid Calculation
    calculateGridStep(range) {
      const roughSteps = 10;
      const roughStep = range / roughSteps;
      const power = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const normalized = roughStep / power;

      let niceStep;
      if (normalized < 1.5) niceStep = 1;
      else if (normalized < 3.5) niceStep = 2;
      else if (normalized < 7.5) niceStep = 5;
      else niceStep = 10;

      return niceStep * power;
    }

    // Render Pipeline
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      // Background
      ctx.fillStyle = this.theme.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      if (this.showGrid) {
        this.drawGrid();
      }

      this.drawAxes();
      this.drawShadedRegions();
      this.drawShapes();
      this.drawLines();
      this.drawCurves();
      this.drawMarkers();
      this.drawInteractivePoints();

      if (this.showCrosshairs && this.mousePos && !this.isDragging) {
        this.drawCrosshairs();
      }
    }

    drawGrid() {
      const ctx = this.ctx;
      const xRange = this.viewport.xMax - this.viewport.xMin;
      const yRange = this.viewport.yMax - this.viewport.yMin;

      const xStep = this.calculateGridStep(xRange);
      const yStep = this.calculateGridStep(yRange);

      ctx.lineWidth = 1;

      // Vertical grid lines
      const xStart = Math.floor(this.viewport.xMin / xStep) * xStep;
      for (let x = xStart; x <= this.viewport.xMax; x += xStep) {
        const sx = this.toScreenX(x);
        ctx.strokeStyle = Math.abs(x) < 1e-9 ? this.theme.axis : this.theme.gridMajor;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, this.height);
        ctx.stroke();

        // Tick labels
        if (Math.abs(x) > 1e-9) {
          const sy = Math.max(16, Math.min(this.height - 8, this.toScreenY(0) + 16));
          ctx.fillStyle = this.theme.text;
          ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(Number(x.toFixed(4)).toString(), sx, sy);
        }
      }

      // Horizontal grid lines
      const yStart = Math.floor(this.viewport.yMin / yStep) * yStep;
      for (let y = yStart; y <= this.viewport.yMax; y += yStep) {
        const sy = this.toScreenY(y);
        ctx.strokeStyle = Math.abs(y) < 1e-9 ? this.theme.axis : this.theme.gridMajor;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(this.width, sy);
        ctx.stroke();

        // Tick labels
        if (Math.abs(y) > 1e-9) {
          const sx = Math.max(26, Math.min(this.width - 24, this.toScreenX(0) - 8));
          ctx.fillStyle = this.theme.text;
          ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(Number(y.toFixed(4)).toString(), sx, sy + 4);
        }
      }
    }

    drawAxes() {
      const ctx = this.ctx;
      const originX = this.toScreenX(0);
      const originY = this.toScreenY(0);

      ctx.strokeStyle = this.theme.axis;
      ctx.lineWidth = 1.5;

      // X-Axis
      if (originY >= 0 && originY <= this.height) {
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(this.width, originY);
        ctx.stroke();
      }

      // Y-Axis
      if (originX >= 0 && originX <= this.width) {
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, this.height);
        ctx.stroke();
      }

      // Origin (0,0) label
      if (originX >= 10 && originX <= this.width - 10 && originY >= 10 && originY <= this.height - 10) {
        ctx.fillStyle = this.theme.text;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('0', originX - 6, originY + 14);
      }
    }

    drawCurves() {
      const ctx = this.ctx;
      const numSamples = Math.min(1200, Math.max(600, Math.round(this.width * 1.5)));
      const step = (this.viewport.xMax - this.viewport.xMin) / numSamples;

      for (const curve of this.curves) {
        ctx.save();
        ctx.strokeStyle = curve.color || this.theme.primaryCurve;
        ctx.lineWidth = curve.width || 2.5;
        if (curve.dashed) {
          ctx.setLineDash(curve.dashed);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        let isDrawing = false;
        let prevY = 0;

        for (let i = 0; i <= numSamples; i++) {
          const x = this.viewport.xMin + i * step;
          let y;
          try {
            y = curve.fn(x);
          } catch (e) {
            y = NaN;
          }

          if (isNaN(y) || !isFinite(y)) {
            isDrawing = false;
            continue;
          }

          const sx = this.toScreenX(x);
          const sy = this.toScreenY(y);

          // Discontinuity/Asymptote jump detection
          if (isDrawing && Math.abs(sy - prevY) > this.height * 0.95 && Math.sign(y) !== Math.sign(this.toWorldY(prevY))) {
            isDrawing = false;
          }

          if (!isDrawing) {
            ctx.moveTo(sx, sy);
            isDrawing = true;
          } else {
            ctx.lineTo(sx, sy);
          }
          prevY = sy;
        }

        ctx.stroke();
        ctx.restore();
      }
    }

    drawShapes() {
      const ctx = this.ctx;
      for (const shape of this.shapes) {
        if (shape.type === 'rect') {
          const sx1 = this.toScreenX(shape.xLeft);
          const sx2 = this.toScreenX(shape.xRight);
          const sy0 = this.toScreenY(shape.y0 || 0);
          const sy1 = this.toScreenY(shape.y1);

          const w = sx2 - sx1;
          const h = sy1 - sy0;

          ctx.fillStyle = shape.fill || (shape.isPositive ? this.theme.areaPositive : this.theme.areaNegative);
          ctx.fillRect(sx1, sy0, w, h);

          ctx.strokeStyle = shape.stroke || (shape.isPositive ? this.theme.borderPositive : this.theme.borderNegative);
          ctx.lineWidth = 1;
          ctx.strokeRect(sx1, sy0, w, h);
        } else if (shape.type === 'trapezoid') {
          const sx1 = this.toScreenX(shape.xLeft);
          const sx2 = this.toScreenX(shape.xRight);
          const sy0 = this.toScreenY(0);
          const syL = this.toScreenY(shape.yLeft);
          const syR = this.toScreenY(shape.yRight);

          ctx.beginPath();
          ctx.moveTo(sx1, sy0);
          ctx.lineTo(sx1, syL);
          ctx.lineTo(sx2, syR);
          ctx.lineTo(sx2, sy0);
          ctx.closePath();

          ctx.fillStyle = shape.fill || (shape.isPositive ? this.theme.areaPositive : this.theme.areaNegative);
          ctx.fill();

          ctx.strokeStyle = shape.stroke || (shape.isPositive ? this.theme.borderPositive : this.theme.borderNegative);
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (shape.type === 'polygon' && shape.points) {
          ctx.beginPath();
          shape.points.forEach((p, idx) => {
            const sx = this.toScreenX(p.x);
            const sy = this.toScreenY(p.y);
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = shape.fill;
          ctx.fill();
          if (shape.stroke) {
            ctx.strokeStyle = shape.stroke;
            ctx.lineWidth = shape.lineWidth || 1;
            ctx.stroke();
          }
        }
      }
    }

    drawShadedRegions() {
      const ctx = this.ctx;
      for (const region of this.shadedRegions) {
        const { f, a, b } = region;
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        const samples = 200;
        const step = (end - start) / samples;

        ctx.beginPath();
        ctx.moveTo(this.toScreenX(start), this.toScreenY(0));

        for (let i = 0; i <= samples; i++) {
          const x = start + i * step;
          const y = f(x);
          if (!isNaN(y) && isFinite(y)) {
            ctx.lineTo(this.toScreenX(x), this.toScreenY(y));
          }
        }

        ctx.lineTo(this.toScreenX(end), this.toScreenY(0));
        ctx.closePath();

        ctx.fillStyle = region.fill || this.theme.areaPositive;
        ctx.fill();
      }
    }

    drawLines() {
      const ctx = this.ctx;
      for (const line of this.lines) {
        ctx.save();
        ctx.strokeStyle = line.color || '#fff';
        ctx.lineWidth = line.width || 2;
        if (line.dashed) {
          ctx.setLineDash(line.dashed);
        }
        ctx.beginPath();
        ctx.moveTo(this.toScreenX(line.p1.x), this.toScreenY(line.p1.y));
        ctx.lineTo(this.toScreenX(line.p2.x), this.toScreenY(line.p2.y));
        ctx.stroke();
        ctx.restore();
      }
    }

    drawMarkers() {
      const ctx = this.ctx;
      for (const m of this.markers) {
        const sx = this.toScreenX(m.x);
        const sy = this.toScreenY(m.y);

        if (m.type === 'hole') {
          // Open circle for removable discontinuity
          ctx.save();
          ctx.fillStyle = this.theme.bg;
          ctx.strokeStyle = m.color || this.theme.secondaryCurve;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          // Standard filled point
          ctx.save();
          ctx.fillStyle = m.color || this.theme.primaryCurve;
          ctx.beginPath();
          ctx.arc(sx, sy, m.radius || 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (m.label) {
          ctx.fillStyle = this.theme.text;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.label, sx, sy - 10);
        }
      }
    }

    drawInteractivePoints() {
      const ctx = this.ctx;
      for (const pt of this.interactivePoints) {
        const sx = this.toScreenX(pt.x);
        const sy = this.toScreenY(pt.y !== undefined ? pt.y : 0);
        const r = pt.radius || 7;

        // Outer glow
        ctx.beginPath();
        ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = pt.glowColor || 'rgba(56, 189, 248, 0.25)';
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = pt.fill || '#ffffff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = pt.color || this.theme.primaryCurve;
        ctx.stroke();

        // Label
        if (pt.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText(pt.label, sx, sy - r - 6);
          ctx.shadowBlur = 0;
        }
      }
    }

    drawCrosshairs() {
      const ctx = this.ctx;
      const { screenX, screenY, worldX, worldY } = this.mousePos;

      ctx.save();
      ctx.strokeStyle = this.theme.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, this.height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(this.width, screenY);
      ctx.stroke();

      // Coordinate tooltip badge
      const text = `(${worldX.toFixed(2)}, ${worldY.toFixed(2)})`;
      ctx.font = '11px monospace';
      const textWidth = ctx.measureText(text).width;
      const badgeX = Math.min(this.width - textWidth - 16, Math.max(8, screenX + 12));
      const badgeY = Math.min(this.height - 12, Math.max(24, screenY - 12));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.setLineDash([]);
      ctx.fillRect(badgeX - 4, badgeY - 14, textWidth + 8, 20);
      ctx.strokeRect(badgeX - 4, badgeY - 14, textWidth + 8, 20);

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(text, badgeX, badgeY);

      ctx.restore();
    }

    // Graph State Setters
    setCurves(curves) {
      this.curves = curves;
    }

    setShapes(shapes) {
      this.shapes = shapes;
    }

    setLines(lines) {
      this.lines = lines;
    }

    setMarkers(markers) {
      this.markers = markers;
    }

    setShadedRegions(regions) {
      this.shadedRegions = regions;
    }

    setInteractivePoints(points) {
      this.interactivePoints = points;
    }

    exportPNG(filename = 'calculus-graph.png') {
      const link = document.createElement('a');
      link.download = filename;
      link.href = this.canvas.toDataURL('image/png');
      link.click();
    }
  }

  global.CalcGraph = CalcGraph;
})(typeof window !== 'undefined' ? window : this);
