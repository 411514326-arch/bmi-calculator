#!/usr/bin/env python3
"""
BMI Calculator CLI
A clean, cross-platform Body Mass Index (BMI) calculator.
"""

import argparse
import sys

def calculate_bmi_metric(height_cm: float, weight_kg: float) -> float:
    """Calculate BMI using metric units."""
    height_m = height_cm / 100.0
    return weight_kg / (height_m ** 2)

def calculate_bmi_imperial(height_inches: float, weight_lbs: float) -> float:
    """Calculate BMI using imperial units."""
    return (weight_lbs * 703.0) / (height_inches ** 2)

def get_bmi_category(bmi: float) -> tuple[str, str]:
    """Return category name and recommendations based on WHO thresholds."""
    if bmi < 18.5:
        return (
            "Underweight",
            "Your BMI suggests you may be underweight. Consider consulting a nutritionist."
        )
    elif 18.5 <= bmi < 25.0:
        return (
            "Normal weight",
            "Your BMI is within the healthy range. Keep up regular activity and a balanced diet!"
        )
    elif 25.0 <= bmi < 30.0:
        return (
            "Overweight",
            "Your BMI falls into the overweight category. Moderate cardio and dietary balance can help."
        )
    else:
        return (
            "Obese",
            "Your BMI is in the obesity category. Consultation with a healthcare provider is recommended."
        )

def get_healthy_weight_range(height_m: float) -> tuple[float, float]:
    """Calculate healthy weight range (BMI 18.5 - 24.9) in kilograms."""
    min_weight = 18.5 * (height_m ** 2)
    max_weight = 24.9 * (height_m ** 2)
    return (min_weight, max_weight)

def print_results(bmi: float, height_m: float, weight_kg: float, is_imperial: bool = False):
    """Format and print BMI results nicely in terminal."""
    category, advice = get_bmi_category(bmi)
    min_kg, max_kg = get_healthy_weight_range(height_m)

    print("\n" + "=" * 50)
    print("               BMI CALCULATION RESULTS")
    print("=" * 50)
    print(f" BMI Score           : {bmi:.2f}")
    print(f" Classification      : {category}")
    
    if is_imperial:
        min_lbs = min_kg * 2.20462
        max_lbs = max_kg * 2.20462
        print(f" Healthy Weight Range: {min_lbs:.1f} - {max_lbs:.1f} lbs")
    else:
        print(f" Healthy Weight Range: {min_kg:.1f} - {max_kg:.1f} kg")

    print("-" * 50)
    print(f" Advice: {advice}")
    print("=" * 50 + "\n")

def interactive_mode():
    """Run an interactive prompt in terminal."""
    print("\n=== Body Mass Index (BMI) Calculator ===")
    print("Choose Unit:")
    print("1. Metric (Centimeters, Kilograms)")
    print("2. Imperial (Feet/Inches, Pounds)")
    
    choice = input("\nEnter choice (1 or 2) [default 1]: ").strip() or "1"
    
    try:
        if choice == "2":
            feet = float(input("Enter height (feet): ").strip())
            inches = float(input("Enter height (inches): ").strip())
            weight_lbs = float(input("Enter weight (lbs): ").strip())
            
            total_inches = (feet * 12.0) + inches
            if total_inches <= 0 or weight_lbs <= 0:
                print("Error: Height and weight must be positive numbers.")
                return

            bmi = calculate_bmi_imperial(total_inches, weight_lbs)
            height_m = total_inches * 0.0254
            weight_kg = weight_lbs * 0.453592
            print_results(bmi, height_m, weight_kg, is_imperial=True)
        else:
            height_cm = float(input("Enter height (cm): ").strip())
            weight_kg = float(input("Enter weight (kg): ").strip())
            
            if height_cm <= 0 or weight_kg <= 0:
                print("Error: Height and weight must be positive numbers.")
                return

            bmi = calculate_bmi_metric(height_cm, weight_kg)
            height_m = height_cm / 100.0
            print_results(bmi, height_m, weight_kg, is_imperial=False)
            
    except ValueError:
        print("Error: Invalid numeric input. Please enter numbers only.")

def main():
    parser = argparse.ArgumentParser(description="Calculate Body Mass Index (BMI)")
    parser.add_argument("--height", type=float, help="Height (cm for metric, inches for imperial)")
    parser.add_argument("--weight", type=float, help="Weight (kg for metric, lbs for imperial)")
    parser.add_argument("--unit", choices=["metric", "imperial"], default="metric", help="Unit system")

    args = parser.parse_args()

    if args.height and args.weight:
        if args.unit == "imperial":
            bmi = calculate_bmi_imperial(args.height, args.weight)
            height_m = args.height * 0.0254
            weight_kg = args.weight * 0.453592
            print_results(bmi, height_m, weight_kg, is_imperial=True)
        else:
            bmi = calculate_bmi_metric(args.height, args.weight)
            height_m = args.height / 100.0
            print_results(bmi, height_m, args.weight, is_imperial=False)
    else:
        interactive_mode()

if __name__ == "__main__":
    main()
