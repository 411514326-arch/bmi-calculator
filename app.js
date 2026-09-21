document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const metricTab = document.getElementById('metricTab');
  const imperialTab = document.getElementById('imperialTab');
  const metricInputs = document.getElementById('metricInputs');
  const imperialInputs = document.getElementById('imperialInputs');

  // Metric fields
  const heightCmInput = document.getElementById('heightCm');
  const heightCmSlider = document.getElementById('heightCmSlider');
  const weightKgInput = document.getElementById('weightKg');
  const weightKgSlider = document.getElementById('weightKgSlider');

  // Imperial fields
  const heightFtInput = document.getElementById('heightFt');
  const heightInInput = document.getElementById('heightIn');
  const weightLbsInput = document.getElementById('weightLbs');
  const weightLbsSlider = document.getElementById('weightLbsSlider');

  // Form & Results
  const bmiForm = document.getElementById('bmiForm');
  const resultSection = document.getElementById('resultSection');
  const bmiValueEl = document.getElementById('bmiValue');
  const categoryBadgeEl = document.getElementById('categoryBadge');
  const gaugePointerEl = document.getElementById('gaugePointer');
  const healthyRangeEl = document.getElementById('healthyRange');
  const weightDiffEl = document.getElementById('weightDiff');
  const adviceBoxEl = document.getElementById('adviceBox');
  const adviceTextEl = document.getElementById('adviceText');

  let currentUnit = 'metric'; // 'metric' or 'imperial'

  // Tab switching
  metricTab.addEventListener('click', () => {
    if (currentUnit === 'metric') return;
    currentUnit = 'metric';
    metricTab.classList.add('active');
    imperialTab.classList.remove('active');
    metricInputs.classList.remove('hidden');
    imperialInputs.classList.add('hidden');
    calculateBMI();
  });

  imperialTab.addEventListener('click', () => {
    if (currentUnit === 'imperial') return;
    currentUnit = 'imperial';
    imperialTab.classList.add('active');
    metricTab.classList.remove('active');
    imperialInputs.classList.remove('hidden');
    metricInputs.classList.add('hidden');
    calculateBMI();
  });

  // Slider <-> Input synchronization
  function bindSliderAndInput(slider, input) {
    slider.addEventListener('input', () => {
      input.value = slider.value;
      calculateBMI();
    });
    input.addEventListener('input', () => {
      if (input.value) {
        slider.value = input.value;
        calculateBMI();
      }
    });
  }

  bindSliderAndInput(heightCmSlider, heightCmInput);
  bindSliderAndInput(weightKgSlider, weightKgInput);
  bindSliderAndInput(weightLbsSlider, weightLbsInput);

  heightFtInput.addEventListener('input', calculateBMI);
  heightInInput.addEventListener('input', calculateBMI);

  // Form submit
  bmiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateBMI();
  });

  function calculateBMI() {
    let bmi = 0;
    let heightMeters = 0;
    let weightKg = 0;
    let isImperial = (currentUnit === 'imperial');

    if (isImperial) {
      const feet = parseFloat(heightFtInput.value) || 0;
      const inches = parseFloat(heightInInput.value) || 0;
      const totalInches = (feet * 12) + inches;
      const weightLbs = parseFloat(weightLbsInput.value) || 0;

      if (totalInches <= 0 || weightLbs <= 0) return;

      bmi = (weightLbs * 703) / (totalInches * totalInches);
      heightMeters = totalInches * 0.0254;
      weightKg = weightLbs * 0.453592;
    } else {
      const heightCm = parseFloat(heightCmInput.value) || 0;
      weightKg = parseFloat(weightKgInput.value) || 0;

      if (heightCm <= 0 || weightKg <= 0) return;

      heightMeters = heightCm / 100;
      bmi = weightKg / (heightMeters * heightMeters);
    }

    displayResults(bmi, heightMeters, weightKg, isImperial);
  }

  function displayResults(bmi, heightMeters, weightKg, isImperial) {
    if (isNaN(bmi) || bmi <= 0) return;

    resultSection.classList.remove('hidden');

    const formattedBMI = bmi.toFixed(1);
    bmiValueEl.textContent = formattedBMI;

    // Categories
    let category = '';
    let categoryColor = '';
    let advice = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      categoryColor = 'var(--underweight)';
      advice = 'Your BMI suggests you may be underweight. It is advisable to consult a healthcare provider or nutritionist for balanced dietary strategies.';
    } else if (bmi < 25.0) {
      category = 'Normal Weight';
      categoryColor = 'var(--normal)';
      advice = 'Congratulations! Your BMI is within the healthy weight range. Keep maintaining regular physical exercise and nutritious eating habits.';
    } else if (bmi < 30.0) {
      category = 'Overweight';
      categoryColor = 'var(--overweight)';
      advice = 'Your BMI falls into the overweight category. Incorporating more moderate cardio, strength training, and dietary moderation can help reach optimal health.';
    } else {
      category = 'Obese';
      categoryColor = 'var(--obese)';
      advice = 'Your BMI is in the obesity category. We recommend discussing healthy lifestyle interventions and structured guidance with a certified medical professional.';
    }

    categoryBadgeEl.textContent = category;
    categoryBadgeEl.style.backgroundColor = categoryColor;
    adviceBoxEl.style.borderLeftColor = categoryColor;
    adviceTextEl.textContent = advice;

    // Pointer position on the gauge (BMI scale from 15 to 40 mapped to 0% to 100%)
    const minBMI = 15;
    const maxBMI = 40;
    const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
    const percentage = ((clampedBMI - minBMI) / (maxBMI - minBMI)) * 100;
    gaugePointerEl.style.left = `${percentage}%`;

    // Healthy weight range (18.5 to 24.9 BMI)
    const minHealthyKg = 18.5 * (heightMeters * heightMeters);
    const maxHealthyKg = 24.9 * (heightMeters * heightMeters);

    if (isImperial) {
      const minHealthyLbs = (minHealthyKg * 2.20462).toFixed(1);
      const maxHealthyLbs = (maxHealthyKg * 2.20462).toFixed(1);
      healthyRangeEl.textContent = `${minHealthyLbs} – ${maxHealthyLbs} lbs`;

      const currentLbs = parseFloat(weightLbsInput.value);
      if (currentLbs < minHealthyLbs) {
        const diff = (minHealthyLbs - currentLbs).toFixed(1);
        weightDiffEl.textContent = `+${diff} lbs to normal`;
      } else if (currentLbs > maxHealthyLbs) {
        const diff = (currentLbs - maxHealthyLbs).toFixed(1);
        weightDiffEl.textContent = `-${diff} lbs to normal`;
      } else {
        weightDiffEl.textContent = 'Optimal Range ✓';
      }
    } else {
      healthyRangeEl.textContent = `${minHealthyKg.toFixed(1)} – ${maxHealthyKg.toFixed(1)} kg`;

      if (weightKg < minHealthyKg) {
        const diff = (minHealthyKg - weightKg).toFixed(1);
        weightDiffEl.textContent = `+${diff} kg to normal`;
      } else if (weightKg > maxHealthyKg) {
        const diff = (weightKg - maxHealthyKg).toFixed(1);
        weightDiffEl.textContent = `-${diff} kg to normal`;
      } else {
        weightDiffEl.textContent = 'Optimal Range ✓';
      }
    }
  }

  // Initial calculation
  calculateBMI();
});
