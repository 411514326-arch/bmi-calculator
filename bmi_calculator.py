#!/usr/bin/env python3
\"\"\"A robust, dependency-free BMI calculator for adults (18+).\"\"\"

from __future__ import annotations

import argparse
import json
import math
import sys
from dataclasses import asdict, dataclass

KG_PER_LB = 0.45359237
METERS_PER_INCH = 0.0254


@dataclass(frozen=True)
class BMIResult:
    bmi: float
    category: str
    healthy_weight_min_kg: float
    healthy_weight_max_kg: float
    advice: str


def positive_number(value: str) -> float:
    \"\"\"Parse a finite, strictly positive number for argparse.\"\"\"
    try:
        number = float(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f\"{value!r} is not a number.\") from error
    if not math.isfinite(number) or number <= 0:
        raise argparse.ArgumentTypeError(\"Value must be a finite number greater than zero.\")
    return number


def bmi_category(bmi: float) -> tuple[str, str]:
    \"\"\"Return the WHO adult BMI classification and general guidance.\"\"\"
    if bmi < 18.5:
        return \"Underweight\", \"Consider discussing nutrition and any unintentional weight loss with a clinician.\"
    if bmi < 25:
        return \"Healthy weight\", \"Maintain regular activity, sleep, and a balanced diet.\"
    if bmi < 30:
        return \"Overweight\", \"A clinician can help you set sustainable activity and nutrition goals if desired.\"
    if bmi < 35:
        return \"Obesity (class I)\", \"Consider discussing personalised, sustainable support with a healthcare professional.\"
    if bmi < 40:
        return \"Obesity (class II)\", \"A healthcare professional can help assess health risks and support options.\"
    return \"Obesity (class III)\", \"Please consider seeking personalised advice from a healthcare professional.\"


def calculate_bmi(height_m: float, weight_kg: float) -> BMIResult:
    \"\"\"Calculate BMI and the adult healthy-weight range for a height in metres.\"\"\"
    if not (0.5 <= height_m <= 3.0):
        raise ValueError(\"Height must be between 0.5 and 3.0 metres.\")
    if not (1.0 <= weight_kg <= 700.0):
        raise ValueError(\"Weight must be between 1 and 700 kilograms.\")

    bmi = weight_kg / height_m**2
    category, advice = bmi_category(bmi)
    return BMIResult(
        bmi=bmi,
        category=category,
        healthy_weight_min_kg=18.5 * height_m**2,
        healthy_weight_max_kg=24.9 * height_m**2,
        advice=advice,
    )


def format_result(result: BMIResult, *, unit: str) -> str:
    \"\"\"Render a human-readable calculation result.\"\"\"
    if unit == \"imperial\":
        low = result.healthy_weight_min_kg / KG_PER_LB
        high = result.healthy_weight_max_kg / KG_PER_LB
        range_text = f\"{low:.1f}–{high:.1f} lb\"
    else:
        range_text = f\"{result.healthy_weight_min_kg:.1f}–{result.healthy_weight_max_kg:.1f} kg\"

    return (\n+        \"\\nBMI CALCULATION\\n\"\n+        \"================\\n\"\n+        f\"BMI:                  {result.bmi:.1f}\\n\"\n+        f\"Classification:       {result.category}\\n\"\n+        f\"Healthy weight range: {range_text}\\n\"\n+        f\"Note: {result.advice}\\n\"\n+        \"\\nBMI is a screening measure, not a diagnosis. It may be less accurate for athletes, \"\n+        \"pregnant people, and some other groups; adult thresholds are not for children or teens.\"\n+    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(\"--unit\", choices=(\"metric\", \"imperial\"), default=\"metric\", help=\"Input/output unit system (default: metric).\")
    parser.add_argument(\"--height\", type=positive_number, help=\"Height in cm (metric) or total inches (imperial).\")
    parser.add_argument(\"--weight\", type=positive_number, help=\"Weight in kg (metric) or lb (imperial).\")
    parser.add_argument(\"--feet\", type=positive_number, help=\"Height feet; use with --inches (imperial only).\")
    parser.add_argument(\"--inches\", type=float, default=0.0, help=\"Additional height inches, from 0 up to 12 (imperial only).\")
    parser.add_argument(\"--json\", action=\"store_true\", help=\"Print the result as JSON.\")
    return parser


def interactive_input() -> tuple[float, float, str]:
    print(\"BMI Calculator (adults 18+)\")
    unit = input(\"Unit [metric/imperial] (metric): \"\).strip().lower() or \"metric\"
    if unit not in {\"metric\", \"imperial\"}:
        raise ValueError(\"Unit must be metric or imperial.\")
    if unit == \"metric\":
        return positive_number(input(\"Height (cm): \")) / 100, positive_number(input(\"Weight (kg): \")), unit
    feet = positive_number(input(\"Height (feet): \"))
    inches = float(input(\"Additional inches [0–11.99]: \"))
    if not math.isfinite(inches) or not 0 <= inches < 12:
        raise ValueError(\"Additional inches must be from 0 up to 12.\")
    return (feet * 12 + inches) * METERS_PER_INCH, positive_number(input(\"Weight (lb): \")) * KG_PER_LB, unit


def main() -> int:
    args = build_parser().parse_args()
    try:
        supplied_height = args.height is not None or args.feet is not None
        if supplied_height or args.weight is not None:
            if args.weight is None:
                raise ValueError(\"--weight is required when height is supplied.\")
            if args.unit == \"metric\":
                if args.height is None or args.feet is not None:
                    raise ValueError(\"Metric mode requires --height in centimetres; do not use --feet.\")
                height_m, weight_kg = args.height / 100, args.weight
            else:
                if args.height is not None and args.feet is not None:
                    raise ValueError(\"Use either --height (total inches) or --feet/--inches, not both.\")
                if args.height is not None:
                    total_inches = args.height
                elif args.feet is not None and 0 <= args.inches < 12:
                    total_inches = args.feet * 12 + args.inches
                else:
                    raise ValueError(\"Imperial mode requires --height or --feet (with optional --inches from 0 up to 12).\")
                height_m, weight_kg = total_inches * METERS_PER_INCH, args.weight * KG_PER_LB
            unit = args.unit
        else:
            height_m, weight_kg, unit = interactive_input()

        result = calculate_bmi(height_m, weight_kg)
        if args.json:
            print(json.dumps(asdict(result), indent=2))
        else:
            print(format_result(result, unit=unit))
        return 0
    except (ValueError, argparse.ArgumentTypeError) as error:
        print(f\"Error: {error}\", file=sys.stderr)
        return 2


if __name__ == \"__main__\":
    raise SystemExit(main())
