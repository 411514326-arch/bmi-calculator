# ⚖️ BMI Calculator & Health Tracker

A modern, responsive Body Mass Index (BMI) calculator application, complete with an interactive web interface and a standalone Python command-line utility.

---

## 🌟 Features

- **Dual Unit Support**: Effortlessly switch between **Metric** (cm / kg) and **Imperial** (ft·in / lbs).
- **Interactive Visual Gauge**: Color-coded spectrum matching WHO standards:
  - 🔵 **Underweight**: &lt; 18.5
  - 🟢 **Normal weight**: 18.5 – 24.9
  - 🟠 **Overweight**: 25.0 – 29.9
  - 🔴 **Obese**: &ge; 30.0
- **Healthy Weight Target**: Automatically computes your optimal weight range based on your exact height.
- **Weight Difference Indicator**: Shows how many kilograms or pounds to gain or lose to reach normal range.
- **Python CLI Tool**: Command-line interface with interactive mode and argument flags.

---

## 🚀 Quick Start

### 1. Web Application
Simply double-click `index.html` or open it in your favorite web browser (Chrome, Edge, Firefox, etc.).

### 2. Python Script
Run in terminal:
```bash
# Interactive mode
python bmi_calculator.py

# Or with CLI arguments
python bmi_calculator.py --height 175 --weight 70 --unit metric
python bmi_calculator.py --height 69 --weight 160 --unit imperial
```

---

## 📐 BMI Formula

$$\text{BMI (Metric)} = \frac{\text{weight (kg)}}{(\text{height (m)})^2}$$

$$\text{BMI (Imperial)} = \frac{\text{weight (lbs)} \times 703}{(\text{height (in)})^2}$$

---

## 🛠️ Project Structure

```
0921test/
├── index.html         # Interactive web calculator layout
├── style.css          # Modern, responsive styling & gauge animations
├── app.js             # Real-time calculation and unit conversion logic
├── bmi_calculator.py  # Python CLI utility
├── .gitignore         # Ignored files for version control
└── README.md          # Project documentation
```

---

## 📦 Git Version Control

To track changes and commit with Git:

```bash
# Check status of files
git status

# Stage all files
git add .

# Commit changes
git commit -m "Add interactive BMI web app and Python calculator"
```
