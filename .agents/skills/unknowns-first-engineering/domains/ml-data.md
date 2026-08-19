# Machine Learning and Data Work

- Define the prediction/analysis target, unit of observation, split strategy, and success metric before implementation.
- Guard against target leakage, duplicate entities across splits, temporal leakage, and train/serve skew.
- Record dataset version, random seeds, preprocessing, features, model parameters, and evaluation procedure.
- Compare against a simple baseline.
- Use metrics appropriate to class balance and decision cost, not accuracy alone.
- Separate exploratory results from validated conclusions.
- Verify reproducibility and artifact loading; never claim generalization from training performance alone.
